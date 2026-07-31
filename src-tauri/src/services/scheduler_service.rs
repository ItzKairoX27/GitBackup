use crate::types::ScheduleConfig;
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio_cron_scheduler::{Job, JobScheduler};

#[derive(Clone)]
pub struct SchedulerService {
    scheduler: Arc<Mutex<Option<JobScheduler>>>,
    job_id: Arc<Mutex<Option<uuid::Uuid>>>,
}

impl SchedulerService {
    pub fn new() -> Self {
        Self {
            scheduler: Arc::new(Mutex::new(None)),
            job_id: Arc::new(Mutex::new(None)),
        }
    }

    pub async fn start<F>(&self, config: &ScheduleConfig, on_trigger: F) -> Result<(), String>
    where
        F: Fn() + Send + Sync + 'static,
    {
        self.stop().await;

        if !config.enabled {
            return Ok(());
        }

        let mut sched_lock = self.scheduler.lock().await;
        if sched_lock.is_none() {
            let sched = JobScheduler::new().await.map_err(|e| e.to_string())?;
            sched.start().await.map_err(|e| e.to_string())?;
            *sched_lock = Some(sched);
        }

        let expression = self.to_cron_expression(config);

        let on_trigger = Arc::new(on_trigger);
        let job = Job::new_async(expression.as_str(), move |_uuid, _l| {
            let on_trigger_clone = on_trigger.clone();
            Box::pin(async move {
                on_trigger_clone();
            })
        })
        .map_err(|e| format!("Failed to create job: {}", e))?;

        let id = job.guid();
        if let Some(sched) = sched_lock.as_mut() {
            sched.add(job).await.map_err(|e| e.to_string())?;
        }

        *self.job_id.lock().await = Some(id);

        Ok(())
    }

    pub async fn stop(&self) {
        let mut job_id_lock = self.job_id.lock().await;
        if let Some(id) = *job_id_lock {
            if let Some(sched) = self.scheduler.lock().await.as_mut() {
                let _ = sched.remove(&id).await;
            }
            *job_id_lock = None;
        }
    }

    pub fn get_next_run(&self, config: &ScheduleConfig) -> Option<String> {
        if !config.enabled {
            return None;
        }
        let time = if config.time.is_empty() {
            "02:00"
        } else {
            &config.time
        };
        match config.frequency.as_str() {
            "interval" => {
                let hours = config.interval_hours.unwrap_or(6);
                Some(format!("Every {} hours", hours))
            }
            "daily" => Some(format!("Daily at {}", time)),
            "weekly" => {
                let days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                let day = config.day_of_week.unwrap_or(0) as usize;
                let day_str = days.get(day).unwrap_or(&"Sun");
                Some(format!("{} at {}", day_str, time))
            }
            "monthly" => Some(format!(
                "{}th of each month at {}",
                config.day_of_month.unwrap_or(1),
                time
            )),
            _ => None,
        }
    }

    fn to_cron_expression(&self, config: &ScheduleConfig) -> String {
        let time = if config.time.is_empty() {
            "02:00"
        } else {
            &config.time
        };
        let mut parts = time.split(':');
        let hour = parts.next().unwrap_or("02");
        let minute = parts.next().unwrap_or("00");
        let h: u32 = hour.parse().unwrap_or(2);
        let m: u32 = minute.parse().unwrap_or(0);

        // tokio-cron-scheduler expects: sec min hour day month dow
        match config.frequency.as_str() {
            "interval" => {
                let hours = config.interval_hours.unwrap_or(6);
                format!("0 {} */{} * * *", m, hours)
            }
            "daily" => format!("0 {} {} * * *", m, h),
            "weekly" => format!("0 {} {} * * {}", m, h, config.day_of_week.unwrap_or(0)),
            "monthly" => format!("0 {} {} {} * *", m, h, config.day_of_month.unwrap_or(1)),
            _ => format!("0 {} {} * * *", m, h),
        }
    }
}

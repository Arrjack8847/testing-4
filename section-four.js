'use strict';
// Section 4 intentionally uses a date-only countdown. Ceremony TIME is unconfirmed.
// To publish a real date, edit DATE_CONFIG and the sample dates in Sections 1–3.
(() => {
  const section = document.getElementById('saveTheDate');
  const invitation = document.getElementById('invitation');
  if (!section || !invitation) return;

  const DATE_CONFIG = Object.freeze({
    date: '2027-01-23',
    confirmed: false,  // Enable calendar download only after verifying the date.
    couple: 'Rayyan & Sofea'
  });

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(DATE_CONFIG.date);
  if (!match) return;
  const year = Number(match[1]), month = Number(match[2]), day = Number(match[3]);
  const eventUTC = Date.UTC(year, month-1, day);
  const checkDate = new Date(eventUTC);
  const valid = checkDate.getUTCFullYear() === year &&
    checkDate.getUTCMonth() === month-1 && checkDate.getUTCDate() === day;
  if (!valid) return;

  const number = document.getElementById('countdownDays');
  const units = document.getElementById('countdownUnit');
  const status = document.getElementById('countdownStatus');
  const button = document.getElementById('saveDateButton');
  const help = document.getElementById('saveDateHelp');
  const dateLabel = section.querySelector('.save-date-small-label');
  const dateTime = section.querySelector('.save-date-full-date');
  const disclaimer = section.querySelector('.save-date-disclaimer');

  const displayDate = new Intl.DateTimeFormat('en-GB',{
    weekday:'long',day:'numeric',month:'long',year:'numeric'
  }).format(new Date(year,month-1,day,12));
  dateTime.dateTime = DATE_CONFIG.date;
  dateTime.textContent = displayDate;
  if (DATE_CONFIG.confirmed) {
    dateLabel.textContent = 'Wedding date';
    disclaimer.textContent = 'Calendar reminder is an all-day date marker. Ceremony time is not specified.';
    button.disabled = false;
    button.textContent = 'Save All-Day Reminder';
    help.textContent = 'Creates an all-day reminder, not a ceremony appointment.';
  } else {
    button.disabled = true;
    button.textContent = 'Save to Calendar';
    help.textContent = 'Calendar reminder available after the wedding date is confirmed.';
  }

  function updateDays() {
    const now = new Date();
    // Compare calendar days rather than guessing an event start hour or timezone.
    const todayUTC = Date.UTC(now.getFullYear(),now.getMonth(),now.getDate());
    const remaining = Math.round((eventUTC - todayUTC)/86400000);
    const sample = DATE_CONFIG.confirmed ? 'wedding' : 'sample wedding';
    number.textContent = String(Math.max(remaining,0));
    units.textContent = remaining===1 ? 'Day' : 'Days';
    if (remaining > 0) status.textContent = 'Days until the ' + sample + ' date';
    else if (remaining === 0) status.textContent = 'The ' + sample + ' date is today';
    else status.textContent = 'The ' + sample + ' date has passed';
  }
  updateDays();

  // No spurious calendar download: click works only if date is explicitly confirmed.
  button.addEventListener('click',() => {
    if (!DATE_CONFIG.confirmed) return;
    const nextUTC = new Date(Date.UTC(year,month-1,day+1));
    const endDate = [
      nextUTC.getUTCFullYear().toString().padStart(4,'0'),
      String(nextUTC.getUTCMonth()+1).padStart(2,'0'),
      String(nextUTC.getUTCDate()).padStart(2,'0')
    ].join('');
    const startDate = DATE_CONFIG.date.replace(/-/g,'');
    const stamp = new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
    const safeTitle = (DATE_CONFIG.couple + ' — Save the Date')
      .replace(/\\/g,'\\\\').replace(/[,;]/g,'\\$&').replace(/\r?\n/g,'\\n');
    const content = [
      'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Original Wedding Invitation//EN',
      'BEGIN:VEVENT',
      'UID:save-the-date-'+startDate+'-'+Date.now()+'@wedding.local',
      'DTSTAMP:'+stamp,
      'DTSTART;VALUE=DATE:'+startDate,
      'DTEND;VALUE=DATE:'+endDate,
      'SUMMARY:'+safeTitle,
      'DESCRIPTION:All-day date reminder; ceremony time not specified.',
      'END:VEVENT','END:VCALENDAR',''
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob([content],{type:'text/calendar;charset=utf-8'}));
    const link=document.createElement('a');
    link.href=url;
    link.download='save-the-date-'+DATE_CONFIG.date+'.ics';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  });

  function syncAccess() {
    const isClosed = invitation.dataset.state !== 'opened';
    section.inert = isClosed;
    section.setAttribute('aria-hidden', String(isClosed));
  }
  syncAccess();
  const stateObserver = new MutationObserver(syncAccess);
  stateObserver.observe(invitation,{attributes:true,attributeFilter:['data-state']});

  let timer = null;
  function stopClock(){
    if (timer!==null){clearInterval(timer);timer=null;}
  }
  function startClock(){
    updateDays();
    if (timer===null && !document.hidden) timer=setInterval(updateDays,60000);
  }
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!reduced.matches && 'IntersectionObserver' in window) {
    section.dataset.revealReady='true';
  }
  if (!('IntersectionObserver' in window)) return;
  let sectionVisible = false;
  const observer = new IntersectionObserver(entries => {
    const visible = entries.some(entry=>entry.isIntersecting);
    sectionVisible=visible;
    if (visible) {
      section.classList.add('is-visible');
      if (!document.hidden) startClock();
    } else stopClock();
  },{threshold:0.05});
  observer.observe(section);
  document.addEventListener('visibilitychange',()=>{
    if (document.hidden) stopClock();
    else if (sectionVisible) startClock();
  });
})();

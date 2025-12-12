// Simple engine simulation for UI
(function(){
  const MAX_RPM = 7000;
  const IDLE_RPM = 700;
  const env = {
    running:false,
    ignition:false,
    throttle:0,
    rpm:0,
    temp:20,
    oil:0,
    fault:null,
    gear: 'N'
  };

  const els = {
    startBtn:document.getElementById('startBtn'),
    stopBtn:document.getElementById('stopBtn'),
    eStopBtn:document.getElementById('eStopBtn'),
    ignition:document.getElementById('ignition'),
    throttle:document.getElementById('throttle'),
    throttleVal:document.getElementById('throttleVal'),
    rpm:document.getElementById('rpm'),
    temp:document.getElementById('temp'),
    oil:document.getElementById('oil'),
    chkRunning:document.querySelector('#chkRunning span'),
    chkIgnition:document.querySelector('#chkIgnition span'),
    chkFault:document.querySelector('#chkFault span'),
    gearDisplay:document.getElementById('gearDisplay'),
    gearButtons:document.querySelectorAll('.gear-btn'),
    log:document.getElementById('log')
  };

  function log(msg){
    const now = new Date().toLocaleTimeString();
    const line = document.createElement('div');
    line.textContent = `[${now}] ${msg}`;
    els.log.prepend(line);
  }

  // Controls
  els.ignition.addEventListener('change', ()=>{
    env.ignition = els.ignition.checked;
    els.chkIgnition.textContent = env.ignition? 'ON':'OFF';
    log(`Ignition ${env.ignition? 'ON':'OFF'}`);
    if(!env.ignition){ env.running = false; updateRunningUI(); }
  });

  els.throttle.addEventListener('input', ()=>{
    env.throttle = Number(els.throttle.value);
    els.throttleVal.textContent = env.throttle + '%';
  });

  els.startBtn.addEventListener('click', ()=>{
    if(!env.ignition){ log('Negalima paleisti: uždegimas išjungtas'); return }
    if(env.running) return;
    env.running = true; updateRunningUI(); log('Variklis paleistas');
  });
  els.stopBtn.addEventListener('click', ()=>{
    if(!env.running) return;
    env.running = false; updateRunningUI(); log('Variklis sustabdytas');
  });
  els.eStopBtn.addEventListener('click', ()=>{
    env.running = false; env.ignition = false; els.ignition.checked = false;
    env.throttle = 0; els.throttle.value = 0; els.throttleVal.textContent = '0%';
    env.rpm = 0; env.oil = 0; env.fault = 'EMERGENCY_STOP';
    env.gear = 'N';
    updateRunningUI(); updateView(); log('EMERGENCY STOP vykdytas');
  });

  // Gear shifting
  els.gearButtons.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const desired = btn.dataset.gear;
      if(desired === env.gear) return;
      const canShift = (!env.running) || env.rpm < 3000;
      if(!canShift){ env.fault = 'SHIFT_BLOCKED'; log(`Pervirtimas į ${desired} užblokuotas (RPM per didelis)`); updateRunningUI(); return }
      env.gear = desired; log(`Pavarą perjungta į ${desired}`); if(env.fault === 'SHIFT_BLOCKED') env.fault = null; updateView();
    });
  });

  function updateRunningUI(){
    els.chkRunning.textContent = env.running? 'YES':'NO';
    els.chkFault.textContent = env.fault? env.fault : 'None';
  }

  // Simulation loop
  setInterval(()=>{
    // rpm target
    let target = 0;
    if(env.ignition){
      if(env.running) target = Math.max(IDLE_RPM, Math.round(env.throttle/100*MAX_RPM));
      else target = env.ignition? IDLE_RPM : 0;
    } else {
      target = 0;
    }

    // smooth rpm change
    env.rpm += (target - env.rpm) * 0.12;
    if(Math.abs(env.rpm - target) < 1) env.rpm = target;

    // temp dynamics
    const heating = env.rpm / MAX_RPM * 0.5; // degrees/sec factor
    if(env.rpm > 0) env.temp += heating; else env.temp -= 0.4;
    env.temp = Math.max(15, Math.min(120, env.temp));

    // oil pressure roughly proportional to rpm when running
    env.oil = Math.round((env.rpm / MAX_RPM) * 5 * 100)/100; // bar, up to ~5 bar

    // fault detection examples
    if(env.temp > 105) env.fault = 'OVERHEAT';
    else if(env.oil < 0.3 && env.rpm > 1000) env.fault = 'LOW_OIL_PRESSURE';
    else env.fault = null;

    updateView();
  }, 250);

  function updateView(){
    els.rpm.textContent = Math.round(env.rpm);
    els.temp.textContent = `${Math.round(env.temp)} °C`;
    els.oil.textContent = `${env.oil.toFixed(2)} bar`;
    els.chkFault.textContent = env.fault? env.fault : 'None';
    // gear view
    els.gearDisplay.textContent = env.gear;
    els.gearButtons.forEach(b=> b.classList.toggle('active', b.dataset.gear === env.gear));
  }

  // initial
  updateRunningUI(); updateView(); log('UI inicijuota');
})();

(() => {
  const defaults = { preset:'high', pixelRatio:1.5, resolution:1, background:true, birdFx:true, particles:true, shader:true, glitch:true, potato:false, sfx:true, music:true, ambient:'off', sfxVolume:0.8, musicVolume:0.35, ambientVolume:0.25 };
  let cfg = {...defaults};
  try { cfg = {...cfg, ...JSON.parse(localStorage.getItem('cf_settings') || '{}')}; } catch {}
  window.CF_SETTINGS = cfg;
  const style = document.createElement('style');
  style.textContent = `
  #settings-panel{position:fixed;inset:0;z-index:10020;background:#02040bdc;display:none;align-items:center;justify-content:center;padding:14px;font-family:Orbitron,Arial,sans-serif;color:#e8f3ff}
  #settings-panel.open{display:flex} #settings-panel .sp-card{width:min(620px,100%);max-height:90vh;overflow:auto;background:linear-gradient(145deg,#101a30,#070b16);border:1px solid #20d9cf;border-radius:18px;padding:18px;box-shadow:0 0 35px #00e5ff33}
  #settings-panel h2{font-size:18px;color:#63fff0;margin:0 0 14px} #settings-panel h3{font-size:12px;color:#7dd3fc;margin:16px 0 8px;letter-spacing:1px}
  #settings-panel .sp-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}
  #settings-panel button,#settings-panel select{background:#111d32;color:#eafaff;border:1px solid #34516c;border-radius:9px;padding:10px;font:inherit;font-size:11px}
  #settings-panel button.active{border-color:#00f5d4;background:#073d3c;color:#9efff3}
  #settings-panel .sp-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid #ffffff12;font-size:11px}
  #settings-panel input[type=range]{width:45%;accent-color:#00e5d4} #settings-panel .sp-close{float:right}
  #settings-panel .sp-note{font:10px Arial;color:#91a6bf;line-height:1.5}
  @media(max-width:420px){#settings-panel .sp-grid{grid-template-columns:repeat(2,1fr)}}
  `;
  document.head.appendChild(style);
  const panel = document.createElement('div');
  panel.id='settings-panel';
  panel.innerHTML=`<section class="sp-card">
    <button class="sp-close" id="sp-close">TUTUP ✕</button><h2>⚙ SYSTEM SETTINGS</h2>
    <h3>GRAPHICS PRESET</h3><div class="sp-grid" id="sp-presets">
      <button data-preset="low">LOW</button><button data-preset="medium">MEDIUM</button><button data-preset="high">HIGH</button><button data-preset="ultra">ULTRA</button>
    </div>
    <h3>CUSTOM GRAPHICS</h3>
    <div class="sp-row"><span>Render resolution</span><select id="sp-resolution"><option value=".5">50% · Potato</option><option value=".7">70%</option><option value=".85">85%</option><option value="1">100%</option></select></div>
    <div class="sp-row"><span>Pixel ratio cap</span><select id="sp-pixel"><option value=".75">Low · 0.75x</option><option value="1">1x</option><option value="1.5">1.5x</option><option value="2">2x</option></select></div>
    ${[['background','Background animation'],['birdFx','Bird effects'],['particles','Particles & floating text'],['shader','Shaders / glow'],['glitch','Glitch effects'],['potato','Potato mode']].map(([k,l])=>`<label class="sp-row"><span>${l}</span><input type="checkbox" id="sp-${k}"></label>`).join('')}
    <h3>AUDIO</h3>
    ${[['sfx','Sound effects'],['music','Background music']].map(([k,l])=>`<label class="sp-row"><span>${l}</span><input type="checkbox" id="sp-${k}"></label>`).join('')}
    <div class="sp-row"><span>SFX volume</span><input id="sp-sfxvol" type="range" min="0" max="1" step=".05"></div>
    <div class="sp-row"><span>Music volume</span><input id="sp-musicvol" type="range" min="0" max="1" step=".05"></div>
    <div class="sp-row"><span>Ambient atmosphere</span><select id="sp-ambient"><option value="off">Off</option><option value="rain">Rain</option><option value="storm">Storm ambience</option><option value="wind">Digital wind</option></select></div>
    <div class="sp-row"><span>Ambient volume</span><input id="sp-ambientvol" type="range" min="0" max="1" step=".05"></div>
    <p class="sp-note">Pengaturan grafik langsung diterapkan. Render resolution dan pixel ratio mengurangi beban GPU; keduanya bukan bitrate video. Audio ambient dibuat secara prosedural dan tidak memerlukan file musik eksternal.</p>
  </section>`;
  document.body.appendChild(panel);
  const $=id=>document.getElementById(id);
  const save=()=>{try{localStorage.setItem('cf_settings',JSON.stringify(cfg));}catch{};window.CF_SETTINGS=cfg;};
  function applyPreset(p){
    cfg.preset=p;
    const map={
      low:{resolution:.5,pixelRatio:.75,background:false,birdFx:false,particles:false,shader:false,glitch:false,potato:true},
      medium:{resolution:.7,pixelRatio:1,background:true,birdFx:false,particles:false,shader:false,glitch:false,potato:false},
      high:{resolution:1,pixelRatio:1.5,background:true,birdFx:true,particles:true,shader:true,glitch:true,potato:false},
      ultra:{resolution:1,pixelRatio:2,background:true,birdFx:true,particles:true,shader:true,glitch:true,potato:false}
    }[p];
    Object.assign(cfg,map); render(); save(); resizeGame();
  }
  function resizeGame(){
    const c=document.getElementById('gameCanvas'); if(!c)return;
    // Trigger existing responsive canvas sizing.
    window.dispatchEvent(new Event('resize'));
    c.style.imageRendering=cfg.potato?'pixelated':'auto';
    c.style.filter=cfg.shader?'':'none';
    c.style.boxShadow=cfg.shader?'':'none';
  }
  function render(){
    document.querySelectorAll('[data-preset]').forEach(b=>b.classList.toggle('active',b.dataset.preset===cfg.preset));
    ['background','birdFx','particles','shader','glitch','potato','sfx','music'].forEach(k=>{const e=$('sp-'+k);if(e)e.checked=!!cfg[k]});
    $('sp-resolution').value=String(cfg.resolution);$('sp-pixel').value=String(cfg.pixelRatio);
    $('sp-sfxvol').value=cfg.sfxVolume;$('sp-musicvol').value=cfg.musicVolume;$('sp-ambient').value=cfg.ambient;$('sp-ambientvol').value=cfg.ambientVolume;
  }
  function updateAudio(){
    window.CyberFlappyAudio?.setEnabled(cfg.sfx || cfg.music);
    window.CyberFlappyAudio?.setSfxVolume(cfg.sfx?cfg.sfxVolume:0);
    window.CyberFlappyAudio?.setMusicEnabled(!!cfg.music);
    ambient.set(cfg.ambient,cfg.ambientVolume);
  }
  // Lightweight procedural ambience; starts only after a user interaction.
  const ambient={ctx:null,src:null,gain:null,filter:null,kind:'off',
    set(kind,vol){this.kind=kind;if(!this.ctx||kind==='off'||vol<=0){if(this.gain&&this.ctx)this.gain.gain.setTargetAtTime(0,this.ctx.currentTime,.15);return;}
      if(this.src){this.gain.gain.setTargetAtTime(0,this.ctx.currentTime,.15);this.src.stop();this.src=null;}
      const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
      if(!this.ctx)this.ctx=new AC();this.ctx.resume();
      const n=this.ctx.sampleRate*2,buf=this.ctx.createBuffer(1,n,this.ctx.sampleRate),d=buf.getChannelData(0);
      for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(kind==='rain'?.22:kind==='storm'?.3:.12);
      const src=this.ctx.createBufferSource();src.buffer=buf;src.loop=true;
      const filter=this.ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=kind==='rain'?2600:kind==='storm'?850:500;
      const gain=this.ctx.createGain();gain.gain.value=0;
      src.connect(filter);filter.connect(gain);gain.connect(this.ctx.destination);src.start();
      gain.gain.setTargetAtTime(Math.min(.12,vol*.12),this.ctx.currentTime,.4);
      this.src=src;this.gain=gain;this.filter=filter;
    }};
  $('settings-open')?.addEventListener('click',()=>{render();panel.classList.add('open')});
  $('sp-close').onclick=()=>panel.classList.remove('open');
  panel.addEventListener('click',e=>{if(e.target===panel)panel.classList.remove('open')});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')panel.classList.remove('open')});
  document.querySelectorAll('[data-preset]').forEach(b=>b.onclick=()=>applyPreset(b.dataset.preset));
  ['background','birdFx','particles','shader','glitch','potato','sfx','music'].forEach(k=>$('sp-'+k).onchange=e=>{cfg[k]=e.target.checked;cfg.preset='custom';render();save();resizeGame();updateAudio()});
  $('sp-resolution').onchange=e=>{cfg.resolution=Number(e.target.value);cfg.preset='custom';save();resizeGame()};
  $('sp-pixel').onchange=e=>{cfg.pixelRatio=Number(e.target.value);cfg.preset='custom';save();resizeGame()};
  [['sp-sfxvol','sfxVolume'],['sp-musicvol','musicVolume'],['sp-ambientvol','ambientVolume']].forEach(([id,k])=>$(id).oninput=e=>{cfg[k]=Number(e.target.value);save();updateAudio()});
  $('sp-ambient').onchange=e=>{cfg.ambient=e.target.value;save();updateAudio()};
  render();
  window.addEventListener('cyberflappy:audio-toggle',()=>{cfg.sfx=!!window.CyberFlappyAudio?.isEnabled?.();cfg.music=cfg.sfx;save();updateAudio();});
  document.addEventListener('pointerdown',()=>{if(cfg.ambient!=='off')updateAudio()},{once:true});
  updateAudio();resizeGame();
})();
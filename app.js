const toast=document.getElementById('toast');let timer;
function notice(text){toast.textContent=text;toast.classList.remove('opacity-0','-translate-y-3');clearTimeout(timer);timer=setTimeout(()=>toast.classList.add('opacity-0','-translate-y-3'),2000)}
document.querySelectorAll('[data-copy]').forEach(b=>b.addEventListener('click',async()=>{const el=document.getElementById(b.dataset.copy);try{await navigator.clipboard.writeText(el.innerText);notice('コピーしました ✓')}catch{const range=document.createRange();range.selectNodeContents(el);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);notice('選択した文章を長押ししてコピーしてください')}}));
let presets;document.querySelectorAll('[data-preset]').forEach(b=>b.addEventListener('click',async()=>{try{presets??=await fetch('presets.json').then(r=>{if(!r.ok)throw new Error();return r.json()});const data=presets[b.dataset.preset];document.querySelectorAll('[data-preset]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));document.getElementById('preset-title').textContent=data.title;const el=document.getElementById('preset-description');el.replaceChildren(...data.description.split(/(?<=[、。])/).filter(Boolean).map(t=>{const s=document.createElement('span');s.className='keep';s.textContent=t;return s}));document.getElementById('preset-prompt').textContent=data.prompt;notice(data.title+'の指示文に切り替えました')}catch{notice('読み込めませんでした。通信を確認して再度お試しください。')}}));

document.querySelectorAll('.video-compare, [data-autoplay-group]').forEach(group=>{
  const videos=[...group.querySelectorAll('video')];
  let inView=false, version=0;
  videos.forEach(video=>{video.muted=true;video.defaultMuted=true;video.setAttribute('muted','');});
  function ready(video){
    if(video.readyState>=2)return Promise.resolve();
    return new Promise((resolve,reject)=>{
      const clear=()=>{video.removeEventListener('loadeddata',loaded);video.removeEventListener('error',failed);};
      const loaded=()=>{clear();resolve();};
      const failed=()=>{clear();reject(video.error);};
      video.addEventListener('loadeddata',loaded,{once:true});
      video.addEventListener('error',failed,{once:true});
      video.preload='auto';
      video.load();
    });
  }
  function stop(){version++;videos.forEach(video=>video.pause());}
  async function start(){
    const attempt=++version;
    try{
      await Promise.all(videos.map(ready));
      if(attempt!==version||!inView||document.hidden)return;
      videos.forEach(video=>{video.currentTime=0;});
      await Promise.all(videos.map(video=>video.play()));
    }catch{if(attempt===version)stop();}
  }
  new IntersectionObserver(entries=>{
    const entry=entries[0];
    const visible=entry.isIntersecting&&entry.intersectionRatio>=0.35;
    if(visible===inView)return;
    inView=visible;
    if(inView&&!document.hidden)start();else stop();
  },{threshold:[0,0.35]}).observe(group);
  videos[0]?.addEventListener('ended',()=>{if(inView&&!document.hidden)start();});
  videos[0]?.addEventListener('timeupdate',()=>{
    if(videos[0].paused)return;
    videos.slice(1).forEach(video=>{
      if(!video.paused&&Math.abs(video.currentTime-videos[0].currentTime)>0.15)video.currentTime=Math.min(videos[0].currentTime,video.duration);
    });
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else if(inView)start();});
});

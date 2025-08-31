
(function(){
  function _0x1f3c(_0x12a4){return String.fromCharCode.apply(null,_0x12a4);}
  
  // 🚫 Disable right-click, drag, text select
  document.addEventListener(_0x1f3c([99,111,110,116,101,120,116,109,101,110,117]),function(e){e[_0x1f3c([112,114,101,118,101,110,116,68,101,102,97,117,108,116])]();});
  document.addEventListener(_0x1f3c([100,114,97,103,115,116,97,114,116]),function(e){e[_0x1f3c([112,114,101,118,101,110,116,68,101,102,97,117,108,116])]();});
  document.addEventListener(_0x1f3c([115,101,108,101,99,116,115,116,97,114,116]),function(e){e[_0x1f3c([112,114,101,118,101,110,116,68,101,102,97,117,108,116])]();});

  // 🚫 Disable shortcuts (F12, Ctrl+Shift+I/J/C, Ctrl+U, Ctrl+S, etc.)
  document.addEventListener(_0x1f3c([107,101,121,100,111,119,110]),function(e){
    var k=e.key.toLowerCase();
    if(k===_0x1f3c([102,49,50])){e.preventDefault();return false;}
    if(e.ctrlKey&&e.shiftKey&&[_0x1f3c([105]),_0x1f3c([106]),_0x1f3c([99])].includes(k)){e.preventDefault();return false;}
    if(e.ctrlKey&&[_0x1f3c([117]),_0x1f3c([115]),_0x1f3c([97]),_0x1f3c([99]),_0x1f3c([120]),_0x1f3c([118])].includes(k)){e.preventDefault();return false;}
  });

  // 🔍 Detect if DevTools is open
  (function devToolsWatcher(){
    const threshold = 160;
    setInterval(function(){
      let start = new Date();
      debugger; // triggers longer execution if DevTools is open
      if(new Date()-start>threshold){
        location.reload(); // 🔄 Auto-reload if detected
      }
    },1000);
  })();
})();


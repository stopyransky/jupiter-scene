/* tslint:disable no-console */
import jupiter from './jupiter.js';

document.onreadystatechange = () => {
  const state = document.readyState;
  if (state === 'interactive') {
    document.getElementById('contents').style.visibility = 'hidden';
  } else if (state === 'complete') {
    document.getElementById('interactive');
    document.getElementById('loader').style.visibility = 'hidden';
    document.getElementById('contents').style.visibility = 'visible';
    jupiter.init();
  }
};

window.addEventListener('resize', jupiter.onResize);

// Please like <3 and share if you enjoyed!

let reelContents = ["😂", "😍", "😅", "🤔", "😜", "🤐", "😱", "😵"];
let reelLength = 3;
let reelContainers = document.querySelectorAll(".reel-container");
let spinningReels = [];
let spinning = false;
let reelDelay = 100;

let spinsWithoutWin = 0;
let forcedWinSymbols = [null, null, null];
let reelMoveCounts = [0, 0, 0];

let money = 100;
let moneyToAdd = 0;

let audioCtx = new (window.AudioContext || window.webkitAudioContext)();

let masterVolume = audioCtx.createGain();
masterVolume.gain.setValueAtTime(0.05, audioCtx.currentTime);
masterVolume.connect(audioCtx.destination);

let getReelItem = (reelIndex) => {
  let newReel = document.createElement("div");
  let symbol = reelContents[Math.floor(Math.random() * reelContents.length)];
  
  if (reelIndex !== undefined && reelMoveCounts[reelIndex] === 7 && forcedWinSymbols[reelIndex] !== null) {
      symbol = forcedWinSymbols[reelIndex];
  }

  newReel.innerHTML = symbol;
  newReel.classList.add("reel-item");
  setTimeout(() => {
    newReel.classList.add("active");
  }, 0);

  return newReel;
};

let startSpin = () => {
  if (!spinning && money > 0) {
    document.querySelectorAll(".prize-item.active").forEach(s => {
      s.classList.remove("active");
    });
    updateMoney(-1);
    setChange(-1);
    
    reelMoveCounts = [0, 0, 0];
    forcedWinSymbols = [null, null, null];
    
    if (spinsWithoutWin >= 30) {
        let winSymbol = reelContents[Math.floor(Math.random() * reelContents.length)];
        let isTriple = Math.random() < 0.20;
        
        if (isTriple) {
            forcedWinSymbols = [winSymbol, winSymbol, winSymbol];
        } else {
            let differentSymbols = reelContents.filter(s => s !== winSymbol);
            let diffSymbol = differentSymbols[Math.floor(Math.random() * differentSymbols.length)];
            let diffReelIndex = Math.floor(Math.random() * 3);
            for (let i = 0; i < 3; i++) {
                if (i === diffReelIndex) {
                    forcedWinSymbols[i] = diffSymbol;
                } else {
                    forcedWinSymbols[i] = winSymbol;
                }
            }
        }
    }
    
    spinningReels.push(0);
    setTimeout(() => {
      spinningReels.push(1);
    }, reelDelay);
    setTimeout(() => {
      spinningReels.push(2);
    }, reelDelay * 2);

    spinning = true;
    spinUpdate(7);
  }
};

let spinUpdate = spinsLeft => {
  spinningReels.forEach(n => {
    moveReel(n);
  });
  if (spinsLeft > 0) {
    setTimeout(() => {
      spinUpdate(spinsLeft - 1);
    }, reelDelay);
  } else {
    if (spinningReels.length > 0) {
      spinningReels.shift();

      setTimeout(() => {
        spinUpdate(0);
      }, reelDelay);
      playNote(160 - (30 - spinningReels.length * 10), 0.1);
    } else {
      spinning = false;
      findWins();
    }
  }
};

let moveReel = reelIndex => {
  if (reelIndex !== undefined) reelMoveCounts[reelIndex]++;
  let selectedReel = reelContainers[reelIndex];
  selectedReel.prepend(getReelItem(reelIndex));
  if (selectedReel.children.length > reelLength) {
    selectedReel.lastElementChild.classList.add("deactivate");
    setTimeout(() => {
      selectedReel.removeChild(selectedReel.lastElementChild);
    }, reelDelay);
  }
};

let updateMoney = change => {
  money += change;
  document.querySelector("#money").innerText = money;
};

let setChange = change => {
  let changes = document.querySelector(".changes");
  let newChange = document.createElement("div");
  newChange.innerHTML = change > 0 ? `+${change}` : change;
  newChange.classList.add("change");
  if (change < 0) newChange.classList.add("negative");
  changes.prepend(newChange);
  if (changes.children.length > 6) {
    changes.removeChild(changes.lastElementChild);
  }
};

let playWinChime = amount => {
  let clampedAm = amount > 20 ? 20 : amount;
  playNote(400 + 100 * (20 - clampedAm), 0.05, "sine");
  if (--amount > 0)
    setTimeout(() => {
      playWinChime(amount);
    }, 70);
};

let findWins = () => {
  let winline = [];
  let symbols = {};
  reelContainers.forEach(reel => {
    let symbol = reel.children[1].innerText;
    winline.push(symbol);
    if (symbols[symbol]) symbols[symbol]++;
    else symbols[symbol] = 1;
  });

  let won = false;

  if (
    winline.filter(s => {
      return s === winline[0];
    }).length === 3
  ) {
    win(3, winline[0]);
    document
      .querySelector(".triples")
      .children[reelContents.indexOf(winline[0])].classList.add("active");
    won = true;
  } else {
    for (let s in symbols) {
      if (symbols[s] == 2) {
        win(2, s);
        document
          .querySelector(".doubles")
          .children[reelContents.indexOf(s)].classList.add("active");
        won = true;
      }
    }
  }
  
  if (won) {
      spinsWithoutWin = 0;
  } else {
      spinsWithoutWin++;
  }
  updatePityDisplay();
};

let win = (amountMatching, symbol) => {
  reelContainers.forEach(reel => {
    if (reel.children[1].innerText === symbol)
      reel.children[1].classList.add("win");
  });
  let winAmount = 1 + reelContents.indexOf(symbol);
  playWinChime(winAmount);
  if (amountMatching == 3) winAmount *= 100;

  setChange(winAmount);
  addToMoney(winAmount);
};

let addToMoney = (amount, speed) => {
  let changeAmount = Math.ceil(amount / 2);
  updateMoney(changeAmount);
  let remainder = amount - changeAmount;
  if (!speed) speed = 101;
  speed -= 5;
  if (speed < 10) speed = 10;
  if (remainder)
    setTimeout(() => {
      addToMoney(remainder);
    }, speed);
};

function playNote(freq, dur, type) {
  if (!freq) freq = 1000;
  if (!dur) dur = 1;
  if (!type) type = "square";
  return new Promise(res => {
    let oscillator = audioCtx.createOscillator();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime); // value in hertz
    oscillator.connect(masterVolume);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + dur);
    oscillator.onended = res;
  });
}

//fills reels
reelContainers.forEach((reel, i) => {
  for (let n = 0; n < reelLength; n++) {
    moveReel(i);
  }
});

let addToPrizeTable = (combo, amount, target) => {
  let pt = document.querySelector(`.prize-table .${target}`);
  let prize = document.createElement("div");
  prize.innerHTML = `${combo}: ${amount}`;
  prize.classList.add("prize-item");
  prize.setAttribute("win-attr", combo.replace(/[-❔]/g, ""));
  pt.append(prize);
};

//fill prize table
reelContents.forEach((symbol, index) => {
  addToPrizeTable(`${symbol}-${symbol}-❔`, index + 1, "doubles");
});

reelContents.forEach((symbol, index) => {
  addToPrizeTable(
    `${symbol}-${symbol}-${symbol}`,
    (index + 1) * 100,
    "triples"
  );
});

let pityDisplay = document.createElement("div");
pityDisplay.className = "pity-display";
pityDisplay.style.textAlign = "center";
pityDisplay.style.color = "#ff4081";
pityDisplay.style.fontSize = "18px";
pityDisplay.style.fontWeight = "bold";
pityDisplay.style.margin = "15px 0";

let playArea = document.querySelector(".play-area");
if (playArea) {
    playArea.parentNode.insertBefore(pityDisplay, playArea.nextSibling);
}

let updatePityDisplay = () => {
    let spinsLeft = 30 - spinsWithoutWin;
    if (spinsLeft <= 0) {
        pityDisplay.innerHTML = "✨ <b>本次旋转必定中奖！</b> ✨";
    } else {
        pityDisplay.innerHTML = `距离触发保底还剩 <b>${spinsLeft}</b> 次`;
    }
};

updatePityDisplay();

const gameScreen = document.getElementById("game-screen");
const player = document.getElementById("player");
const cpu = document.getElementById("cpu");
const cpuNormalImage = cpu.getAttribute("src");
const cpuHitMark = document.getElementById("cpu-hit-mark");
const playerHitMark = document.getElementById("player-hit-mark");
const roarWarning = document.getElementById("roar-warning");
const battleTimer = document.getElementById("battle-timer");
const finishLabel = document.getElementById("finish-label");
const resultLabel = document.getElementById("result-label");
const cpuStaminaFill = document.querySelector(".cpu-gauges .stamina .gauge-fill");
const cpuStaminaTrack = cpuStaminaFill.parentElement;
const cpuRoarFill = document.querySelector(".cpu-gauges .roar .gauge-fill");
const cpuImages = {
    roar: "assets/characters/cpu/roar/咆哮_ノーマル.png",
    punch: { left: "assets/characters/cpu/punch/パンチ_ノーマル_左.png", right: "assets/characters/cpu/punch/パンチ_ノーマル_右.png" },
    dodge: { left: "assets/characters/cpu/dodge/回避_ノーマル_左.png", right: "assets/characters/cpu/dodge/回避_ノーマル_右.png" },
    pickup: "assets/characters/cpu/pick up/拾い_ノーマル.png",
    sit: "assets/characters/cpu/sit/座り_ノーマル.png",
    sleep: "assets/characters/cpu/sleep/眠り_ノーマル.png",
};
const carrot = document.getElementById("carrot");
const carrotGauge = document.getElementById("carrot-gauge");
const struggleUi = document.getElementById("struggle-ui");
const struggleTime = document.getElementById("struggle-time");
const strugglePlayerScore = document.getElementById("struggle-player-score");
const struggleCpuScore = document.getElementById("struggle-cpu-score");
const struggleFeedback = document.getElementById("struggle-feedback");
const normalImage = player.getAttribute("src");
const sittingImage = "assets/characters/player/sit/座り_プレイヤー.png";
const punchImages = {
    0: "assets/characters/player/punch/パンチ_プレイヤー_左.png",
    2: "assets/characters/player/punch/パンチ_プレイヤー_右.png",
};
const punchFrames = {
    0: { windup: normalImage, contact: punchImages[0], recovery: normalImage },
    2: { windup: normalImage, contact: punchImages[2], recovery: normalImage },
};
const dodgeImages = {
    left: "assets/characters/player/dodge/回避_プレイヤー_左.png",
    right: "assets/characters/player/dodge/回避_プレイヤー_右.png",
};
const dodgeFrames = {
    left: {
        start: { image: normalImage, compactPose: false },
        pose: { image: dodgeImages.left, compactPose: true },
        recovery: { image: normalImage, compactPose: false },
    },
    right: {
        start: { image: normalImage, compactPose: false },
        pose: { image: dodgeImages.right, compactPose: true },
        recovery: { image: normalImage, compactPose: false },
    },
};
const roarImage = "assets/characters/player/roar/咆哮_プレイヤー.png";
const pickupImage = "assets/characters/player/pick up/拾い_プレイヤー.png";
const roarFill = document.querySelector(".player-gauges .roar .gauge-fill");
const staminaFill = document.querySelector(".player-gauges .stamina .gauge-fill");
const staminaTrack = staminaFill.parentElement;
const punchDurations = { windup: 180, contact: 100, recovery: 170 };
const dodgeDurations = { start: 80, pose: 140, recovery: 180 };
const standUpDuration = 250;
const pickupDuration = 450;
const standUpFrame = { image: normalImage, compactPose: false };
// 攻撃方向と必要な回避方向の対応。CPUの攻撃判定を実装するときに利用する。
const dodgeDirectionForAttack = { left: "left", right: "right" };
const roarDuration = 1000;
const matchDuration = 100000;
const finishDisplayDuration = 1200;
const resultDisplayDuration = 2200;
const roarWarningDuration = 600;
const roarTargetLockDuration = 4000;
const roarCounterLockDuration = 2000;
const eatingPercentPerSecond = 5;
const maxStamina = 10;
const punchStaminaCost = 1;
const hitStaminaCost = 1;
const dodgeRoarGain = 5;
const punchInvulnerabilityDuration = 1500;
const carrotRepickupDelay = 800;
const naturalRecoveryInterval = 2000;
const sleepRecoveryInterval = 1000;
const sleepRecoveryAmount = 2;
const fatigueDuration = 4000;
const fatigueRecoveryStamina = 3;
// STAGE 1 (Cランク) の暫定AI値。競り合い実装時に取得開始の調停を置き換える。
const cpuAi = {
    tick: 50, pickupDelayMin: 50, pickupDelayMax: 200,
    decisionMin: 750, decisionMax: 1300,
    dodgeChance: 0.3, dodgeReaction: 140,
    sitChance: 0.25, sitMin: 1600, sitMax: 2800,
    sleepThreshold: 4, wakeStamina: 8,
    roarChance: 0.25, warningCancelChance: 0.2, warningReaction: 420,
};
const struggleDuration = 3000;
const struggleCpuProfiles = {
    C: { tapMin: 400, tapMax: 600, missChance: 0.3 },
    // B・Aランクはそれぞれの数値が決まった時点で追加する。
};
const struggleCpuProfile = struggleCpuProfiles.C;
let actionInProgress = false;
let punchPhase = null;
let punchTimer = null;
let punchGeneration = 0;
const pressedPunchButtons = new Set();
let dodgePhase = null;
let dodgeDirection = null;
let dodgeStartedAt = 0;
let dodgeTimer = null;
let dodgeGeneration = 0;
let standingUp = false;
let standUpTimer = null;
let standUpGeneration = 0;
let pickupInProgress = false;
let pickupTimer = null;
let pickupGeneration = 0;
let roarInProgress = false;
let playerRoarStunned = false;
let playerCounterStunned = false;
let pendingRoar = null;
let pendingRoarTimer = null;
let roarGauge = 50;
let stamina = maxStamina;
let fatigued = false;
let fatigueTimer = null;
let naturalRecoveryElapsed = 0;
let sleepRecoveryElapsed = 0;
let lastStaminaUpdate = performance.now();
const carrotState = {
    holder: "ground", // ground / player / cpu
    eaten: { player: 0, cpu: 0 },
    repickupBlockedUntil: { player: 0, cpu: 0 },
    get remaining() {
        return Math.max(0, 100 - this.eaten.player - this.eaten.cpu);
    },
    get winner() {
        if (this.eaten.player > 50) return "player";
        if (this.eaten.cpu > 50) return "cpu";
        return null;
    },
};
let lastEatingUpdate = performance.now();
const playerState = {
    mode: "normal",
    sleepHitCount: 0,
    carrotHitCount: 0,
    punchInvulnerableUntil: 0,
    get hasCarrot() {
        return carrotState.holder === "player";
    },
    get rapidRoarRecovery() {
        return this.mode === "sleeping" && !standingUp;
    },
    get eatingSpeedMultiplier() {
        return this.mode === "sittingEating" && !standingUp ? 2 : 1;
    },
};
const cpuState = {
    mode: "normal",
    stamina: maxStamina,
    roarGauge: 50,
    punchHitCount: 0,
    punchInvulnerableUntil: 0,
    dodgeDirection: null,
    dodgeStartedAt: 0,
    dodgeGeneration: 0,
    lastResolvedPunch: -1,
    lastResolvedAttack: -1,
    punchGeneration: 0,
    pickupGeneration: 0,
    pickupTimer: null,
    standUpGeneration: 0,
    sleepHitCount: 0,
    fatigued: false,
    roarStunned: false,
    counterStunned: false,
    fatigueTimer: null,
    naturalRecoveryElapsed: 0,
    sleepRecoveryElapsed: 0,
    lastStaminaUpdate: performance.now(),
    nextDecisionAt: performance.now() + 500,
    nextRoarDecisionAt: performance.now() + 500,
    nextPickupAt: performance.now() + 50 + Math.random() * 150,
    sitUntil: 0,
};
let cpuHitEffectTimer = null;
let playerHitEffectTimer = null;
const roarState = { phase: null, attacker: null, generation: 0, warningTimer: null, effectTimer: null, cpuCancelTimer: null };
const struggleState = {
    active: false, generation: 0, endsAt: 0,
    playerGood: 0, cpuGood: 0,
    lastPlayerButton: null, lastCpuButton: null,
    pressedButtons: new Set(),
    finishTimer: null, displayTimer: null, cpuTimer: null,
};
let struggleAudioContext = null;
let struggleMusicTimer = null;
let struggleMusicStep = 0;
const matchState = {
    remainingMs: matchDuration, lastTickAt: performance.now(), clockTimer: null,
    finished: false, winner: null, reason: null, generation: 0,
    finishTimer: null, resultTimer: null,
};

function renderMatchClock() {
    const seconds = Math.ceil(matchState.remainingMs / 1000);
    battleTimer.textContent = String(seconds);
    battleTimer.setAttribute("aria-label", `残り時間 ${seconds}`);
}

function stopMatchClock() {
    clearInterval(matchState.clockTimer);
    matchState.clockTimer = null;
}

function startMatchClock() {
    if (matchState.finished || matchState.clockTimer) return;
    matchState.lastTickAt = performance.now();
    matchState.clockTimer = setInterval(tickMatchClock, 50);
}

function tickMatchClock() {
    if (matchState.finished || struggleState.active) return;
    const now = performance.now();
    updateEatingProgress();
    if (matchState.finished) return; // 同時成立時は食事による勝利が先。
    matchState.remainingMs = Math.max(0, matchState.remainingMs - (now - matchState.lastTickAt));
    matchState.lastTickAt = now;
    renderMatchClock();
    if (matchState.remainingMs === 0) {
        const winner = carrotState.eaten.player === carrotState.eaten.cpu ? null :
            carrotState.eaten.player > carrotState.eaten.cpu ? "player" : "cpu";
        finishMatch(winner, "timeout");
    }
}

function stopBattleActions() {
    clearPendingRoar();
    clearTimeout(punchTimer);
    punchTimer = null;
    punchPhase = null;
    punchGeneration += 1;
    clearTimeout(dodgeTimer);
    dodgeTimer = null;
    dodgePhase = null;
    dodgeDirection = null;
    dodgeGeneration += 1;
    clearTimeout(standUpTimer);
    standUpTimer = null;
    standingUp = false;
    standUpGeneration += 1;
    clearTimeout(pickupTimer);
    pickupTimer = null;
    pickupInProgress = false;
    pickupGeneration += 1;
    actionInProgress = false;
    pressedPunchButtons.clear();
    clearTimeout(fatigueTimer);
    fatigueTimer = null;
    clearTimeout(cpuState.fatigueTimer);
    cpuState.fatigueTimer = null;
    clearTimeout(cpuState.pickupTimer);
    cpuState.pickupTimer = null;
    cpuState.pickupGeneration += 1;
    cpuState.punchGeneration += 1;
    cpuState.dodgeGeneration += 1;
    cpuState.standUpGeneration += 1;
    cpuState.dodgeDirection = null;
    clearTimeout(struggleState.finishTimer);
    clearInterval(struggleState.displayTimer);
    clearTimeout(struggleState.cpuTimer);
    struggleState.finishTimer = null;
    struggleState.displayTimer = null;
    struggleState.cpuTimer = null;
    struggleState.active = false;
    struggleState.generation += 1;
    struggleState.pressedButtons.clear();
    stopStruggleMusic();
    struggleUi.hidden = true;
    gameScreen.classList.remove("is-struggling");
    clearRoarWarning();
    clearTimeout(roarState.effectTimer);
    roarState.effectTimer = null;
    roarState.phase = null;
    roarState.attacker = null;
    roarState.generation += 1;
    roarInProgress = false;
    clearTimeout(cpuHitEffectTimer);
    clearTimeout(playerHitEffectTimer);
    cpuHitEffectTimer = null;
    playerHitEffectTimer = null;
    cpu.classList.remove("is-hit", "is-roar-hit");
    player.classList.remove("is-hit", "is-roar-hit");
    cpuHitMark.classList.remove("is-visible");
    playerHitMark.classList.remove("is-visible");
}

function finishMatch(winner, reason) {
    if (matchState.finished) return false;
    matchState.finished = true;
    matchState.winner = winner;
    matchState.reason = reason;
    matchState.generation += 1;
    stopMatchClock();
    stopBattleActions();
    playerState.mode = playerState.hasCarrot ? "eating" : "normal";
    cpuState.mode = carrotState.holder === "cpu" ? "eating" : "normal";
    showCurrentState();
    showCpuCurrentState();
    finishLabel.hidden = false;
    resultLabel.hidden = true;
    const generation = matchState.generation;
    matchState.finishTimer = setTimeout(() => {
        if (!matchState.finished || generation !== matchState.generation) return;
        finishLabel.hidden = true;
        resultLabel.textContent = winner === "player" ? "WIN" : winner === "cpu" ? "LOSE" : "DRAW";
        resultLabel.dataset.result = winner === "player" ? "win" : winner === "cpu" ? "lose" : "draw";
        resultLabel.hidden = false;
        matchState.resultTimer = setTimeout(() => {
            if (generation === matchState.generation) resultLabel.hidden = true;
        }, resultDisplayDuration);
    }, finishDisplayDuration);
    return true;
}

function restartStage1() {
    stopMatchClock();
    stopBattleActions();
    clearTimeout(matchState.finishTimer);
    clearTimeout(matchState.resultTimer);
    matchState.finishTimer = null;
    matchState.resultTimer = null;
    matchState.generation += 1;
    matchState.finished = true;
    matchState.winner = null;
    matchState.reason = null;
    matchState.remainingMs = matchDuration;
    finishLabel.hidden = true;
    resultLabel.hidden = true;
    resultLabel.textContent = "";
    resultLabel.removeAttribute("data-result");
    carrotState.holder = "ground";
    carrotState.eaten.player = 0;
    carrotState.eaten.cpu = 0;
    carrotState.repickupBlockedUntil.player = 0;
    carrotState.repickupBlockedUntil.cpu = 0;
    playerState.mode = "normal";
    playerState.sleepHitCount = 0;
    playerState.carrotHitCount = 0;
    playerState.punchInvulnerableUntil = 0;
    dodgeStartedAt = 0;
    playerRoarStunned = false;
    playerCounterStunned = false;
    fatigued = false;
    naturalRecoveryElapsed = 0;
    sleepRecoveryElapsed = 0;
    cpuState.mode = "normal";
    cpuState.punchHitCount = 0;
    cpuState.punchInvulnerableUntil = 0;
    cpuState.dodgeStartedAt = 0;
    cpuState.sleepHitCount = 0;
    cpuState.lastResolvedPunch = -1;
    cpuState.lastResolvedAttack = -1;
    cpuState.roarStunned = false;
    cpuState.counterStunned = false;
    cpuState.fatigued = false;
    cpuState.naturalRecoveryElapsed = 0;
    cpuState.sleepRecoveryElapsed = 0;
    cpuState.nextDecisionAt = performance.now() + 500;
    cpuState.nextRoarDecisionAt = performance.now() + 500;
    cpuState.nextPickupAt = performance.now() +
        cpuRandomBetween(cpuAi.pickupDelayMin, cpuAi.pickupDelayMax);
    cpuState.sitUntil = 0;
    struggleState.playerGood = 0;
    struggleState.cpuGood = 0;
    struggleState.lastPlayerButton = null;
    struggleState.lastCpuButton = null;
    struggleState.endsAt = 0;
    lastEatingUpdate = performance.now();
    lastStaminaUpdate = lastEatingUpdate;
    cpuState.lastStaminaUpdate = lastEatingUpdate;
    setStamina(maxStamina);
    setCpuStamina(maxStamina);
    setRoarGauge(50);
    setCpuRoarGauge(50);
    updateCarrotGauge();
    updateCarrotDisplay();
    showCurrentState();
    showCpuCurrentState();
    renderMatchClock();
    matchState.finished = false;
    startMatchClock();
}

window.debugRestartStage1 = restartStage1;

function receiveCpuPunchHit(punchId, attackDirection) {
    if (matchState.finished || struggleState.active) return false;
    if (punchId !== punchGeneration || cpuState.lastResolvedPunch === punchId) return false;

    cpuState.lastResolvedPunch = punchId;
    if (performance.now() < cpuState.punchInvulnerableUntil) return false;
    if (registerCpuDodge(attackDirection)) {
        setCpuRoarGauge(cpuState.roarGauge + dodgeRoarGain);
        return false;
    }
    if (cpuState.mode === "picking") cancelCpuPickup();
    if (cpuState.mode === "sleeping" && ++cpuState.sleepHitCount >= 3) startCpuStandUp();
    cpuState.punchHitCount += 1;
    changeCpuStamina(-hitStaminaCost);

    clearTimeout(cpuHitEffectTimer);
    cpu.classList.remove("is-hit");
    cpuHitMark.classList.remove("is-visible");
    void cpu.offsetWidth;
    cpu.classList.add("is-hit");
    cpuHitMark.classList.add("is-visible");
    cpuHitEffectTimer = setTimeout(() => {
        cpu.classList.remove("is-hit");
        cpuHitMark.classList.remove("is-visible");
        cpuHitEffectTimer = null;
    }, 280);
    if (carrotState.holder === "cpu" && cpuState.punchHitCount >= 3) dropCarrot("cpu", "punch");
    return true;
}

function updateCarrotGauge() {
    carrotGauge.style.setProperty("--carrot-player-share", `${carrotState.eaten.player}%`);
    carrotGauge.style.setProperty("--carrot-cpu-share", `${carrotState.eaten.cpu}%`);
    carrotGauge.setAttribute("aria-label", `にんじん争奪ゲージ 1P ${carrotState.eaten.player.toFixed(1)}% CPU ${carrotState.eaten.cpu.toFixed(1)}%`);
    // 25%ごとの画像差し替えに使える段階。今回は画像自体は変更しない。
    carrot.dataset.eatenQuarter = Math.min(4, Math.floor((100 - carrotState.remaining) / 25));
}

function addCarrotEaten(eater, amount) {
    if (matchState.finished || (eater !== "player" && eater !== "cpu")) return;
    carrotState.eaten[eater] += Math.min(carrotState.remaining, Math.max(0, amount));
    updateCarrotGauge();
    if (carrotState.eaten[eater] > 50) finishMatch(eater, "eating");
}

function updateEatingProgress() {
    const now = performance.now();
    const elapsedSeconds = (now - lastEatingUpdate) / 1000;
    lastEatingUpdate = now;
    if (matchState.finished || struggleState.active) return;
    if (playerState.hasCarrot && !actionInProgress && !fatigued && !playerRoarStunned && !playerCounterStunned && carrotState.remaining > 0) {
        addCarrotEaten("player", eatingPercentPerSecond * playerState.eatingSpeedMultiplier * elapsedSeconds);
    }
    if (matchState.finished) return;
    if (carrotState.holder === "cpu" && !cpuState.fatigued && !cpuState.roarStunned && !cpuState.counterStunned &&
        (cpuState.mode === "eating" || cpuState.mode === "sittingEating") && carrotState.remaining > 0) {
        addCarrotEaten("cpu", eatingPercentPerSecond *
            (cpuState.mode === "sittingEating" ? 2 : 1) * elapsedSeconds);
    }
}

function updateCarrotDisplay() {
    carrot.dataset.holder = carrotState.holder;
    carrot.dataset.pose = playerState.mode === "sittingEating" && !standingUp ? "sitting" : "standing";
}

updateCarrotGauge();
updateCarrotDisplay();

function setStamina(value, triggerFatigue = true) {
    stamina = Math.max(0, Math.min(maxStamina, value));
    staminaFill.style.width = `${stamina / maxStamina * 100}%`;
    staminaTrack.setAttribute("aria-label", `スタミナ ${stamina}/${maxStamina}`);
    if (stamina === maxStamina) {
        naturalRecoveryElapsed = 0;
        sleepRecoveryElapsed = 0;
    }
    if (stamina === 0 && !fatigued && triggerFatigue && !playerRoarStunned) enterFatigue();
}

function updateStaminaRecovery() {
    const now = performance.now();
    const elapsed = now - lastStaminaUpdate;
    lastStaminaUpdate = now;
    if (matchState.finished || struggleState.active) return;
    if (
        fatigued || playerRoarStunned || playerCounterStunned ||
        (actionInProgress && dodgePhase === null) ||
        stamina === maxStamina
    ) return;

    if (playerState.rapidRoarRecovery) {
        sleepRecoveryElapsed += elapsed;
        const ticks = Math.floor(sleepRecoveryElapsed / sleepRecoveryInterval);
        if (ticks > 0) {
            sleepRecoveryElapsed -= ticks * sleepRecoveryInterval;
            setStamina(stamina + ticks * sleepRecoveryAmount);
        }
    } else if (playerState.mode === "normal" || playerState.hasCarrot) {
        naturalRecoveryElapsed += elapsed;
        const ticks = Math.floor(naturalRecoveryElapsed / naturalRecoveryInterval);
        if (ticks > 0) {
            naturalRecoveryElapsed -= ticks * naturalRecoveryInterval;
            setStamina(stamina + ticks);
        }
    }
}

function changeStamina(amount) {
    updateStaminaRecovery();
    if (!fatigued && !playerRoarStunned) setStamina(stamina + amount);
}

function enterFatigue() {
    fatigued = true;
    naturalRecoveryElapsed = 0;
    sleepRecoveryElapsed = 0;
    clearTimeout(fatigueTimer);
    playerState.mode = playerState.hasCarrot ? "eating" : "normal";
    playerState.sleepHitCount = 0;
    updateCarrotDisplay();
    if (!actionInProgress) showCurrentState();
    const round = matchState.generation;
    fatigueTimer = setTimeout(() => {
        if (matchState.finished || round !== matchState.generation) return;
        fatigued = false;
        fatigueTimer = null;
        lastStaminaUpdate = performance.now();
        setStamina(fatigueRecoveryStamina);
        if (!actionInProgress) showCurrentState();
    }, fatigueDuration);
}

setStamina(stamina);
setInterval(updateStaminaRecovery, 100);

function setRoarGauge(value) {
    roarGauge = Math.max(0, Math.min(100, value));
    roarFill.style.width = `${roarGauge}%`;
}

setRoarGauge(roarGauge);
function setCpuRoarGauge(value) {
    cpuState.roarGauge = Math.max(0, Math.min(100, value));
    cpuRoarFill.style.width = `${cpuState.roarGauge}%`;
}

setCpuRoarGauge(cpuState.roarGauge);
// 開発確認用。ブラウザのコンソールから呼び出し、ゲーム操作には割り当てない。
window.debugFillPlayerRoarGauge = () => setRoarGauge(100);

setInterval(() => {
    if (!matchState.finished && !fatigued && playerState.rapidRoarRecovery && roarGauge < 100) {
        setRoarGauge(roarGauge + 2);
    }
}, 100);

function showPlayerImage(image, compactPose = false) {
    player.style.width = compactPose ? "42cqw" : "";
    player.style.left = compactPose ? "16cqw" : "";
    player.src = image;
}

function showCurrentState() {
    const isSitting = playerState.mode === "sleeping" || playerState.mode === "sittingEating";
    showPlayerImage(isSitting ? sittingImage : normalImage, isSitting);
    updateCarrotDisplay();
}

function setCarrotHolder(holder) {
    if (matchState.finished || struggleState.active) return;
    if (!["ground", "player", "cpu"].includes(holder) || carrotState.holder === holder) return;
    if (holder === "player" && (fatigued || playerRoarStunned || playerCounterStunned)) return;
    if (holder !== "ground" && (carrotState.holder !== "ground" ||
        performance.now() < carrotState.repickupBlockedUntil[holder])) return;
    if (holder === "cpu" && (cpuState.fatigued || cpuState.roarStunned || cpuState.counterStunned ||
        (cpuState.mode !== "normal" && cpuState.mode !== "picking"))) return;
    if (pickupInProgress && holder !== "ground") cancelPickup();
    if (cpuState.mode === "picking" && holder !== "ground" && holder !== "cpu") cancelCpuPickup();
    updateEatingProgress();
    if (matchState.finished) return;
    updateStaminaRecovery();
    clearPendingRoar();
    if (holder === "player" && punchPhase) cancelPunch();
    const previousHolder = carrotState.holder;
    carrotState.holder = holder;
    if (holder === "player") {
        playerState.mode = "eating";
        playerState.carrotHitCount = 0;
        playerState.sleepHitCount = 0;
    } else if (previousHolder === "player") {
        playerState.mode = "normal";
        playerState.carrotHitCount = 0;
    }
    if (holder === "cpu") {
        cpuState.mode = "eating";
        cpuState.sleepHitCount = 0;
    } else if (previousHolder === "cpu" && cpuState.mode !== "dodging") {
        cpuState.mode = cpuState.roarStunned ? "roarStunned" :
            cpuState.counterStunned ? "counterStunned" : cpuState.fatigued ? "fatigued" : "normal";
    }
    if (holder === "cpu" || previousHolder === "cpu") cpuState.punchHitCount = 0;
    updateCarrotDisplay();
    if (holder === "cpu" || previousHolder === "cpu") showCpuCurrentState();
    if (!actionInProgress && (holder === "player" || previousHolder === "player")) showCurrentState();
}

function dropCarrot(holder, cause) {
    if (carrotState.holder !== holder) return false;
    setCarrotHolder("ground");
    const now = performance.now();
    carrotState.repickupBlockedUntil[holder] = now + carrotRepickupDelay;
    if (cause === "punch") {
        if (holder === "player") playerState.punchInvulnerableUntil = now + punchInvulnerabilityDuration;
        else cpuState.punchInvulnerableUntil = now + punchInvulnerabilityDuration;
    }
    return true;
}

function setCarrotHeld(held) {
    setCarrotHolder(held ? "player" : "ground");
}

// 開発用 C キー。実際の拾い判定やCPU操作には使わない。
window.addEventListener("keydown", (event) => {
    if (matchState.finished || struggleState.active) return;
    if (event.code === "KeyC" && !event.repeat && !event.ctrlKey && !event.altKey && !event.metaKey && carrotState.holder !== "cpu") {
        setCarrotHeld(!playerState.hasCarrot);
    }
    // 開発用: Alt+Shift+1/2=CPU回避、3=CPU所持、4/5=CPUパンチ命中テスト。
    if (event.repeat || !event.altKey || !event.shiftKey || event.ctrlKey || event.metaKey ||
        !["Digit1", "Digit2", "Digit3", "Digit4", "Digit5"].includes(event.code)) return;
    event.preventDefault();
    if (event.code === "Digit1") startCpuDodge("left");
    if (event.code === "Digit2") startCpuDodge("right");
    if (event.code === "Digit3" && (carrotState.holder === "ground" || carrotState.holder === "cpu")) {
        setCarrotHolder(carrotState.holder === "cpu" ? "ground" : "cpu");
    }
    if (carrotState.holder !== "cpu" && cpuState.mode === "normal") {
        if (event.code === "Digit4") receivePlayerPunchHit("left");
        if (event.code === "Digit5") receivePlayerPunchHit("right");
    }
});

function recordSleepHit() {
    if (playerState.mode !== "sleeping" || standingUp) return;

    playerState.sleepHitCount += 1;
    if (playerState.sleepHitCount >= 3) startStandUp();
}

// CPUパンチの接触時にも開発用の被弾テストにも共通利用する。
function receivePlayerPunchHit(attackDirection) {
    if (matchState.finished || struggleState.active) return false;
    if (performance.now() < playerState.punchInvulnerableUntil) return false;
    if (registerSuccessfulDodge(attackDirection)) {
        setRoarGauge(roarGauge + dodgeRoarGain);
        return false;
    }
    if (pickupInProgress) cancelPickup();
    recordSleepHit();
    changeStamina(-hitStaminaCost);
    if (playerState.hasCarrot && ++playerState.carrotHitCount >= 3) dropCarrot("player", "punch");
    clearTimeout(playerHitEffectTimer);
    player.classList.remove("is-hit");
    playerHitMark.classList.remove("is-visible");
    void player.offsetWidth;
    player.classList.add("is-hit");
    playerHitMark.classList.add("is-visible");
    playerHitEffectTimer = setTimeout(() => {
        player.classList.remove("is-hit");
        playerHitMark.classList.remove("is-visible");
        playerHitEffectTimer = null;
    }, 280);
    return true;
}

function toggleSitting() {
    if (matchState.finished || struggleState.active || actionInProgress || fatigued || playerRoarStunned || playerCounterStunned) return;
    clearPendingRoar();
    updateStaminaRecovery();

    if (playerState.mode === "sleeping" || playerState.mode === "sittingEating") {
        startStandUp();
        return;
    }
    updateEatingProgress();
    if (matchState.finished) return;
    playerState.mode = playerState.hasCarrot ? "sittingEating" : "sleeping";
    playerState.sleepHitCount = 0;
    showCurrentState();
}

function playAction(image, compactPose = false, duration = roarDuration, onComplete = null) {
    if (matchState.finished || actionInProgress) return;

    updateEatingProgress();
    if (matchState.finished) return;
    updateStaminaRecovery();
    actionInProgress = true;
    showPlayerImage(image, compactPose);
    const round = matchState.generation;
    setTimeout(() => {
        if (matchState.finished || round !== matchState.generation) return;
        updateEatingProgress();
        if (matchState.finished) return;
        updateStaminaRecovery();
        showCurrentState();
        actionInProgress = false;
        if (onComplete) onComplete();
    }, duration);
}

function startStandUp() {
    if (matchState.finished || actionInProgress || standingUp) return;

    updateEatingProgress();
    if (matchState.finished) return;
    updateStaminaRecovery();
    actionInProgress = true;
    standingUp = true;
    const generation = ++standUpGeneration;
    updateCarrotDisplay();
    showPlayerImage(standUpFrame.image, standUpFrame.compactPose);
    standUpTimer = setTimeout(() => {
        if (generation !== standUpGeneration) return;
        updateEatingProgress();
        if (matchState.finished) return;
        updateStaminaRecovery();
        standingUp = false;
        standUpTimer = null;
        playerState.mode = playerState.hasCarrot ? "eating" : "normal";
        playerState.sleepHitCount = 0;
        showCurrentState();
        actionInProgress = false;
    }, standUpDuration);
}

function cancelStandUp() {
    clearTimeout(standUpTimer);
    standUpGeneration += 1;
    standUpTimer = null;
    standingUp = false;
    actionInProgress = false;
}

function showDodgeFrame(frame) {
    showPlayerImage(frame.image, frame.compactPose);
}

function startDodge(direction) {
    if (matchState.finished || struggleState.active || actionInProgress || fatigued || playerRoarStunned || playerCounterStunned || !dodgeFrames[direction]) return;

    updateEatingProgress();
    if (matchState.finished) return;
    updateStaminaRecovery();
    actionInProgress = true;
    dodgePhase = "start";
    dodgeDirection = direction;
    dodgeStartedAt = performance.now();
    const generation = ++dodgeGeneration;
    const frames = dodgeFrames[direction];
    showDodgeFrame(frames.start);

    dodgeTimer = setTimeout(() => {
        if (generation !== dodgeGeneration) return;
        dodgePhase = "pose";
        showDodgeFrame(frames.pose);
        dodgeTimer = setTimeout(() => {
            if (generation !== dodgeGeneration) return;
            dodgePhase = "recovery";
            showDodgeFrame(frames.recovery);
            dodgeTimer = setTimeout(() => {
                if (generation !== dodgeGeneration) return;
                updateEatingProgress();
                if (matchState.finished) return;
                updateStaminaRecovery();
                dodgePhase = null;
                dodgeDirection = null;
                dodgeTimer = null;
                showCurrentState();
                actionInProgress = false;
            }, dodgeDurations.recovery);
        }, dodgeDurations.pose);
    }, dodgeDurations.start);
}

function cancelDodge() {
    clearTimeout(dodgeTimer);
    dodgeGeneration += 1;
    dodgeTimer = null;
    dodgePhase = null;
    dodgeDirection = null;
    actionInProgress = false;
}

function startCpuDodge(direction) {
    if (matchState.finished || struggleState.active || cpuState.fatigued || cpuState.stamina < 1 ||
        (cpuState.mode !== "normal" && cpuState.mode !== "eating") || !cpuImages.dodge[direction]) return;
    updateCpuStaminaRecovery();
    cpuState.mode = "dodging";
    cpuState.dodgeDirection = direction;
    cpuState.dodgeStartedAt = performance.now();
    changeCpuStamina(-1);
    const generation = ++cpuState.dodgeGeneration;
    setTimeout(() => {
        if (generation !== cpuState.dodgeGeneration) return;
        cpu.src = cpuImages.dodge[direction];
        setTimeout(() => {
            if (generation !== cpuState.dodgeGeneration) return;
            showCpuCurrentState();
            setTimeout(() => {
                if (generation !== cpuState.dodgeGeneration) return;
                cpuState.mode = cpuState.fatigued ? "fatigued" :
                    carrotState.holder === "cpu" ? "eating" : "normal";
                cpuState.dodgeDirection = null;
                showCpuCurrentState();
            }, dodgeDurations.recovery);
        }, dodgeDurations.pose);
    }, dodgeDurations.start);
}

function registerCpuDodge(attackDirection) {
    return cpuState.mode === "dodging" &&
        performance.now() - cpuState.dodgeStartedAt < dodgeDurations.start + dodgeDurations.pose &&
        dodgeDirectionForAttack[attackDirection] === cpuState.dodgeDirection;
}

function registerSuccessfulDodge(attackDirection) {
    const withinWindow = performance.now() - dodgeStartedAt < dodgeDurations.start + dodgeDurations.pose;
    if (!withinWindow || (dodgePhase !== "start" && dodgePhase !== "pose") ||
        dodgeDirectionForAttack[attackDirection] !== dodgeDirection) return false;

    return true;
}

function cpuRandomBetween(min, max) {
    return min + Math.random() * (max - min);
}

function updateStruggleDisplay() {
    struggleTime.textContent = String(Math.max(0, Math.ceil((struggleState.endsAt - performance.now()) / 1000)));
    strugglePlayerScore.textContent = String(struggleState.playerGood);
    struggleCpuScore.textContent = String(struggleState.cpuGood);
}

function playStruggleMusicNote() {
    if (!struggleState.active || !struggleAudioContext || struggleAudioContext.state !== "running") return;
    const notes = [392, 523.25, 587.33, 523.25, 440, 523.25, 659.25, 523.25];
    const now = struggleAudioContext.currentTime;
    const oscillator = struggleAudioContext.createOscillator();
    const gain = struggleAudioContext.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.value = notes[struggleMusicStep++ % notes.length];
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.045, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    oscillator.connect(gain).connect(struggleAudioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.19);
}

function startStruggleMusic() {
    if (!struggleState.active || struggleMusicTimer) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    try {
        if (!struggleAudioContext) struggleAudioContext = new AudioContextClass();
        const generation = struggleState.generation;
        struggleAudioContext.resume().then(() => {
            if (!struggleState.active || generation !== struggleState.generation || struggleMusicTimer) return;
            struggleMusicStep = 0;
            playStruggleMusicNote();
            struggleMusicTimer = setInterval(playStruggleMusicNote, 240);
        }).catch(() => {});
    } catch (_) {
        // 音声出力が使えない環境でも競り合いの判定は継続する。
    }
}

function stopStruggleMusic() {
    clearInterval(struggleMusicTimer);
    struggleMusicTimer = null;
}

function recordStrugglePlayerInput(button) {
    if (!struggleState.active || performance.now() >= struggleState.endsAt ||
        (button !== 0 && button !== 2) || struggleState.pressedButtons.has(button)) return;
    struggleState.pressedButtons.add(button);
    startStruggleMusic();
    const good = struggleState.lastPlayerButton === null || struggleState.lastPlayerButton !== button;
    struggleState.lastPlayerButton = button;
    if (good) struggleState.playerGood += 1;
    struggleFeedback.textContent = good ? "GOOD" : "MISS";
    struggleFeedback.className = `struggle-feedback ${good ? "good" : "miss"}`;
    updateStruggleDisplay();
}

function scheduleStruggleCpuInput(generation) {
    const delay = cpuRandomBetween(struggleCpuProfile.tapMin, struggleCpuProfile.tapMax);
    struggleState.cpuTimer = setTimeout(() => {
        if (!struggleState.active || generation !== struggleState.generation ||
            performance.now() >= struggleState.endsAt) return;
        const first = struggleState.lastCpuButton === null;
        const good = first || Math.random() >= struggleCpuProfile.missChance;
        struggleState.lastCpuButton = first ? (Math.random() < 0.5 ? 0 : 2) :
            good ? (struggleState.lastCpuButton === 0 ? 2 : 0) : struggleState.lastCpuButton;
        if (good) struggleState.cpuGood += 1;
        updateStruggleDisplay();
        scheduleStruggleCpuInput(generation);
    }, delay);
}

function startStruggle() {
    if (matchState.finished || struggleState.active || !pickupInProgress || cpuState.mode !== "picking" ||
        carrotState.holder !== "ground") return;
    updateEatingProgress();
    if (matchState.finished) return;
    tickMatchClock();
    if (matchState.finished) return;
    stopMatchClock();
    updateStaminaRecovery();
    updateCpuStaminaRecovery();
    cancelPickup();
    cancelCpuPickup();
    clearPendingRoar();
    pressedPunchButtons.clear();
    struggleState.pressedButtons.clear();
    struggleState.active = true;
    const generation = ++struggleState.generation;
    struggleState.endsAt = performance.now() + struggleDuration;
    struggleState.playerGood = 0;
    struggleState.cpuGood = 0;
    struggleState.lastPlayerButton = null;
    struggleState.lastCpuButton = null;
    actionInProgress = true;
    cpuState.mode = "struggling";
    showPlayerImage(pickupImage, true);
    cpu.src = cpuImages.pickup;
    struggleFeedback.textContent = "";
    struggleFeedback.className = "struggle-feedback";
    gameScreen.classList.add("is-struggling");
    struggleUi.hidden = false;
    updateStruggleDisplay();
    startStruggleMusic();
    struggleState.displayTimer = setInterval(updateStruggleDisplay, 50);
    struggleState.finishTimer = setTimeout(() => finishStruggle(generation), struggleDuration);
    scheduleStruggleCpuInput(generation);
}

function finishStruggle(generation) {
    if (matchState.finished || !struggleState.active || generation !== struggleState.generation) return;
    clearTimeout(struggleState.finishTimer);
    clearInterval(struggleState.displayTimer);
    clearTimeout(struggleState.cpuTimer);
    stopStruggleMusic();
    struggleState.finishTimer = null;
    struggleState.displayTimer = null;
    struggleState.cpuTimer = null;
    const winner = struggleState.playerGood === struggleState.cpuGood ? null :
        struggleState.playerGood > struggleState.cpuGood ? "player" : "cpu";
    struggleState.active = false;
    struggleState.pressedButtons.clear();
    pressedPunchButtons.clear();
    struggleState.lastPlayerButton = null;
    struggleState.lastCpuButton = null;
    gameScreen.classList.remove("is-struggling");
    struggleUi.hidden = true;
    actionInProgress = false;
    cpuState.mode = "normal";
    lastEatingUpdate = performance.now();
    lastStaminaUpdate = performance.now();
    cpuState.lastStaminaUpdate = performance.now();
    if (winner) setCarrotHolder(winner);
    if (matchState.finished) return;
    showCurrentState();
    showCpuCurrentState();
    startMatchClock();
}

function showCpuCurrentState() {
    cpu.src = cpuState.mode === "sleeping" ? cpuImages.sleep :
        cpuState.mode === "sittingEating" ? cpuImages.sit : cpuNormalImage;
}

function setCpuStamina(value, triggerFatigue = true) {
    cpuState.stamina = Math.max(0, Math.min(maxStamina, value));
    cpuStaminaFill.style.width = `${cpuState.stamina / maxStamina * 100}%`;
    cpuStaminaTrack.setAttribute("aria-label", `スタミナ ${cpuState.stamina}/${maxStamina}`);
    if (cpuState.stamina === maxStamina) {
        cpuState.naturalRecoveryElapsed = 0;
        cpuState.sleepRecoveryElapsed = 0;
    }
    if (cpuState.stamina === 0 && !cpuState.fatigued && triggerFatigue && !cpuState.roarStunned) enterCpuFatigue();
}

function updateCpuStaminaRecovery() {
    const now = performance.now();
    const elapsed = now - cpuState.lastStaminaUpdate;
    cpuState.lastStaminaUpdate = now;
    if (matchState.finished || struggleState.active) return;
    if (cpuState.fatigued || cpuState.roarStunned || cpuState.counterStunned || cpuState.stamina === maxStamina ||
        cpuState.mode === "punching" || cpuState.mode === "picking" || cpuState.mode === "roarWarning" ||
        cpuState.mode === "standingUp") return;
    if (cpuState.mode === "sleeping") {
        setCpuRoarGauge(cpuState.roarGauge + elapsed / 1000 * 20);
        cpuState.sleepRecoveryElapsed += elapsed;
        const ticks = Math.floor(cpuState.sleepRecoveryElapsed / sleepRecoveryInterval);
        if (ticks > 0) {
            cpuState.sleepRecoveryElapsed -= ticks * sleepRecoveryInterval;
            setCpuStamina(cpuState.stamina + ticks * sleepRecoveryAmount);
        }
    } else {
        cpuState.naturalRecoveryElapsed += elapsed;
        const ticks = Math.floor(cpuState.naturalRecoveryElapsed / naturalRecoveryInterval);
        if (ticks > 0) {
            cpuState.naturalRecoveryElapsed -= ticks * naturalRecoveryInterval;
            setCpuStamina(cpuState.stamina + ticks);
        }
    }
}

function changeCpuStamina(amount) {
    updateCpuStaminaRecovery();
    if (!cpuState.fatigued && !cpuState.roarStunned) setCpuStamina(cpuState.stamina + amount);
}

function enterCpuFatigue() {
    cpuState.fatigued = true;
    cpuState.naturalRecoveryElapsed = 0;
    cpuState.sleepRecoveryElapsed = 0;
    if (cpuState.mode === "picking") cancelCpuPickup();
    if (cpuState.mode !== "punching" && cpuState.mode !== "dodging" &&
        cpuState.mode !== "standingUp") {
        cpuState.mode = "fatigued";
        showCpuCurrentState();
    }
    const round = matchState.generation;
    cpuState.fatigueTimer = setTimeout(() => {
        if (matchState.finished || round !== matchState.generation) return;
        cpuState.fatigueTimer = null;
        cpuState.fatigued = false;
        cpuState.lastStaminaUpdate = performance.now();
        setCpuStamina(fatigueRecoveryStamina);
        if (cpuState.mode === "fatigued") {
            cpuState.mode = carrotState.holder === "cpu" ? "eating" : "normal";
            showCpuCurrentState();
        }
    }, fatigueDuration);
}

function cancelCpuPickup() {
    if (cpuState.mode !== "picking") return;
    clearTimeout(cpuState.pickupTimer);
    cpuState.pickupGeneration += 1;
    cpuState.pickupTimer = null;
    cpuState.mode = "normal";
    cpuState.nextPickupAt = performance.now() + cpuRandomBetween(cpuAi.pickupDelayMin, cpuAi.pickupDelayMax);
    showCpuCurrentState();
}

function tryStartCpuPickup() {
    if (matchState.finished || struggleState.active || roarState.phase || carrotState.holder !== "ground" || cpuState.mode !== "normal" ||
        cpuState.fatigued || performance.now() < cpuState.nextPickupAt ||
        performance.now() < carrotState.repickupBlockedUntil.cpu) return;
    updateCpuStaminaRecovery();
    if (pickupInProgress) {
        cpuState.mode = "picking";
        startStruggle();
        return;
    }
    cpuState.mode = "picking";
    cpu.src = cpuImages.pickup;
    const generation = ++cpuState.pickupGeneration;
    cpuState.pickupTimer = setTimeout(() => {
        if (generation !== cpuState.pickupGeneration) return;
        cpuState.pickupTimer = null;
        cpuState.mode = "normal";
        if (carrotState.holder === "ground" && !cpuState.fatigued) setCarrotHolder("cpu");
        showCpuCurrentState();
        cpuState.nextPickupAt = performance.now() + cpuRandomBetween(cpuAi.pickupDelayMin, cpuAi.pickupDelayMax);
    }, pickupDuration);
}

function startCpuStandUp() {
    if (matchState.finished || (cpuState.mode !== "sleeping" && cpuState.mode !== "sittingEating")) return;
    updateEatingProgress();
    if (matchState.finished) return;
    updateCpuStaminaRecovery();
    cpuState.mode = "standingUp";
    cpu.src = cpuNormalImage;
    const generation = ++cpuState.standUpGeneration;
    setTimeout(() => {
        if (generation !== cpuState.standUpGeneration) return;
        cpuState.mode = cpuState.fatigued ? "fatigued" :
            carrotState.holder === "cpu" ? "eating" : "normal";
        cpuState.sleepHitCount = 0;
        showCpuCurrentState();
    }, standUpDuration);
}

function startCpuPunch(direction) {
    if (matchState.finished || struggleState.active || cpuState.mode !== "normal" || cpuState.fatigued || cpuState.stamina < 1 ||
        carrotState.holder === "cpu") return;
    updateCpuStaminaRecovery();
    cpuState.mode = "punching";
    changeCpuStamina(-punchStaminaCost);
    const generation = ++cpuState.punchGeneration;
    cpu.src = cpuNormalImage;
    setTimeout(() => {
        if (generation !== cpuState.punchGeneration) return;
        cpu.src = cpuImages.punch[direction];
        resolveCpuPunchHit(generation, direction);
        setTimeout(() => {
            if (generation !== cpuState.punchGeneration) return;
            cpu.src = cpuNormalImage;
            setTimeout(() => {
                if (generation !== cpuState.punchGeneration) return;
                cpuState.mode = cpuState.fatigued ? "fatigued" : "normal";
                showCpuCurrentState();
            }, punchDurations.recovery);
        }, punchDurations.contact);
    }, punchDurations.windup);
}

function resolveCpuPunchHit(punchId, direction) {
    if (punchId !== cpuState.punchGeneration || cpuState.lastResolvedAttack === punchId) return false;
    cpuState.lastResolvedAttack = punchId;
    return receivePlayerPunchHit(direction);
}

function maybeCpuDodge(attackDirection, punchId) {
    if (matchState.finished) return;
    if (Math.random() >= cpuAi.dodgeChance) return;
    setTimeout(() => {
        if (punchId === punchGeneration && punchPhase === "windup")
            startCpuDodge(dodgeDirectionForAttack[attackDirection]);
    }, cpuAi.dodgeReaction);
}

function cpuBrainTick() {
    if (matchState.finished || struggleState.active) return;
    updateCpuStaminaRecovery();
    if (carrotState.holder === "ground") tryStartCpuPickup();
    if (!roarState.phase && !cpuState.roarStunned && !cpuState.counterStunned &&
        cpuState.roarGauge >= 100 && performance.now() >= cpuState.nextRoarDecisionAt) {
        cpuState.nextRoarDecisionAt = performance.now() +
            cpuRandomBetween(cpuAi.decisionMin, cpuAi.decisionMax);
        if (Math.random() < cpuAi.roarChance && beginRoar("cpu")) return;
    }
    if (cpuState.mode === "sleeping") {
        if (!cpuState.fatigued && (cpuState.stamina >= cpuAi.wakeStamina || carrotState.holder === "ground")) startCpuStandUp();
        return;
    }
    if (cpuState.mode === "sittingEating") {
        if (performance.now() >= cpuState.sitUntil) startCpuStandUp();
        return;
    }
    if (cpuState.mode !== "normal" && cpuState.mode !== "eating") return;
    if (cpuState.fatigued || performance.now() < cpuState.nextDecisionAt) return;
    cpuState.nextDecisionAt = performance.now() + cpuRandomBetween(cpuAi.decisionMin, cpuAi.decisionMax);
    if (carrotState.holder === "cpu") {
        if (Math.random() < cpuAi.sitChance) {
            updateEatingProgress();
            if (matchState.finished) return;
            cpuState.mode = "sittingEating";
            cpuState.sitUntil = performance.now() + cpuRandomBetween(cpuAi.sitMin, cpuAi.sitMax);
            showCpuCurrentState();
        }
    } else if (carrotState.holder === "player") {
        if (cpuState.stamina <= cpuAi.sleepThreshold) {
            cpuState.mode = "sleeping";
            cpuState.sleepHitCount = 0;
            showCpuCurrentState();
        } else {
            startCpuPunch(Math.random() < 0.5 ? "left" : "right");
        }
    }
}

setCpuStamina(cpuState.stamina);
setInterval(cpuBrainTick, cpuAi.tick);

function clearPendingRoar() {
    clearTimeout(pendingRoarTimer);
    pendingRoarTimer = null;
    pendingRoar = null;
}

function cancelPunch() {
    clearTimeout(punchTimer);
    punchGeneration += 1;
    punchTimer = null;
    punchPhase = null;
    actionInProgress = false;
}

function cancelPickup() {
    if (!pickupInProgress) return;
    clearTimeout(pickupTimer);
    pickupGeneration += 1;
    pickupTimer = null;
    pickupInProgress = false;
    actionInProgress = false;
    showCurrentState();
}

function tryStartPickup() {
    if (matchState.finished || struggleState.active || carrotState.holder !== "ground" || playerState.mode !== "normal" || fatigued ||
        playerRoarStunned || playerCounterStunned || roarState.phase ||
        actionInProgress || roarInProgress || standingUp || punchPhase || dodgePhase ||
        pendingRoar || pressedPunchButtons.size > 0 ||
        performance.now() < carrotState.repickupBlockedUntil.player) return;

    updateStaminaRecovery();
    if (cpuState.mode === "picking") {
        actionInProgress = true;
        pickupInProgress = true;
        startStruggle();
        return;
    }
    actionInProgress = true;
    pickupInProgress = true;
    const generation = ++pickupGeneration;
    showPlayerImage(pickupImage, true);
    pickupTimer = setTimeout(() => {
        if (generation !== pickupGeneration) return;
        pickupTimer = null;
        pickupInProgress = false;
        actionInProgress = false;
        if (carrotState.holder === "ground" && !fatigued) setCarrotHolder("player");
        showCurrentState();
    }, pickupDuration);
}

// 入力イベントと既存アクションの終了処理が先に走るよう、取得は次の更新で判定する。
setInterval(tryStartPickup, 100);

function startPunch(button) {
    if (matchState.finished || struggleState.active || actionInProgress || fatigued || playerRoarStunned || playerCounterStunned ||
        stamina < punchStaminaCost || playerState.hasCarrot) return;
    updateEatingProgress();
    if (matchState.finished) return;
    updateStaminaRecovery();
    actionInProgress = true;
    punchPhase = "windup";
    changeStamina(-punchStaminaCost);
    const generation = ++punchGeneration;
    const frames = punchFrames[button];
    const attackDirection = button === 0 ? "left" : "right";
    showPlayerImage(frames.windup);
    maybeCpuDodge(attackDirection, generation);

    punchTimer = setTimeout(() => {
        if (generation !== punchGeneration) return;
        punchPhase = "contact";
        showPlayerImage(frames.contact);
        receiveCpuPunchHit(generation, attackDirection);
        punchTimer = setTimeout(() => {
            if (generation !== punchGeneration) return;
            punchPhase = "recovery";
            showPlayerImage(frames.recovery);
            punchTimer = setTimeout(() => {
                if (generation !== punchGeneration) return;
                updateStaminaRecovery();
                punchPhase = null;
                punchTimer = null;
                showCurrentState();
                actionInProgress = false;
            }, punchDurations.recovery);
        }, punchDurations.contact);
    }, punchDurations.windup);
}

function cancelCpuActionForRoar() {
    if (cpuState.mode === "picking") cancelCpuPickup();
    cpuState.punchGeneration += 1;
    cpuState.dodgeGeneration += 1;
    cpuState.standUpGeneration += 1;
    cpuState.dodgeDirection = null;
}

function clearRoarWarning() {
    clearTimeout(roarState.warningTimer);
    clearTimeout(roarState.cpuCancelTimer);
    roarState.warningTimer = null;
    roarState.cpuCancelTimer = null;
    roarWarning.hidden = true;
    roarWarning.removeAttribute("data-target");
}

function cancelRoarWarning(target) {
    if (matchState.finished || roarState.phase !== "warning" || roarState.attacker === target) return false;
    if (target === "player") {
        if (actionInProgress || fatigued || playerRoarStunned || playerCounterStunned || standingUp ||
            (playerState.mode !== "normal" && playerState.mode !== "eating")) return false;
    } else if (cpuState.fatigued || cpuState.roarStunned || cpuState.counterStunned ||
        (cpuState.mode !== "normal" && cpuState.mode !== "eating")) return false;

    const attacker = roarState.attacker;
    const round = matchState.generation;
    roarState.generation += 1;
    clearRoarWarning();
    roarState.phase = null;
    roarState.attacker = null;
    if (attacker === "player") {
        roarInProgress = false;
        actionInProgress = false;
        playerCounterStunned = true;
        showCurrentState();
        setTimeout(() => {
            if (matchState.finished || round !== matchState.generation) return;
            playerCounterStunned = false;
            lastStaminaUpdate = performance.now();
            showCurrentState();
        }, roarCounterLockDuration);
    } else {
        cpuState.counterStunned = true;
        cpuState.mode = "counterStunned";
        showCpuCurrentState();
        setTimeout(() => {
            if (matchState.finished || round !== matchState.generation) return;
            cpuState.counterStunned = false;
            cpuState.mode = cpuState.fatigued ? "fatigued" :
                carrotState.holder === "cpu" ? "eating" : "normal";
            cpuState.lastStaminaUpdate = performance.now();
            showCpuCurrentState();
        }, roarCounterLockDuration);
    }
    return true;
}

function applyRoarToTarget(target) {
    if (target === "player") {
        if (punchPhase) cancelPunch();
        if (dodgePhase) cancelDodge();
        if (pickupInProgress) cancelPickup();
        if (standingUp) cancelStandUp();
        clearTimeout(fatigueTimer);
        fatigueTimer = null;
        fatigued = false;
        if (playerState.hasCarrot) dropCarrot("player", "roar");
        playerState.mode = "normal";
        playerState.sleepHitCount = 0;
        playerRoarStunned = true;
        actionInProgress = true;
        setStamina(0, false);
        showCurrentState();
        player.classList.add("is-roar-hit");
    } else {
        cancelCpuActionForRoar();
        clearTimeout(cpuState.fatigueTimer);
        cpuState.fatigueTimer = null;
        cpuState.fatigued = false;
        if (carrotState.holder === "cpu") dropCarrot("cpu", "roar");
        cpuState.mode = "roarStunned";
        cpuState.roarStunned = true;
        setCpuStamina(0, false);
        showCpuCurrentState();
        cpu.classList.add("is-roar-hit");
    }
}

function releaseRoarTarget(target) {
    if (target === "player") {
        playerRoarStunned = false;
        actionInProgress = false;
        playerState.mode = playerState.hasCarrot ? "eating" : "normal";
        setStamina(fatigueRecoveryStamina);
        lastStaminaUpdate = performance.now();
        showCurrentState();
    } else {
        cpuState.roarStunned = false;
        cpuState.mode = carrotState.holder === "cpu" ? "eating" : "normal";
        setCpuStamina(fatigueRecoveryStamina);
        cpuState.lastStaminaUpdate = performance.now();
        showCpuCurrentState();
    }
}

function finishRoarEffect(generation, target) {
    if (roarState.phase !== "effect" || generation !== roarState.generation) return;
    roarState.effectTimer = null;
    roarState.phase = null;
    roarState.attacker = null;
    if (target === "cpu") {
        roarInProgress = false;
        actionInProgress = false;
        playerState.mode = playerState.hasCarrot ? "eating" : "normal";
        showCurrentState();
    } else {
        cpuState.mode = cpuState.fatigued ? "fatigued" :
            carrotState.holder === "cpu" ? "eating" : "normal";
        showCpuCurrentState();
    }
    (target === "player" ? player : cpu).classList.remove("is-roar-hit");
    const round = matchState.generation;
    setTimeout(() => {
        if (!matchState.finished && round === matchState.generation) releaseRoarTarget(target);
    }, roarTargetLockDuration);
}

function resolveRoarWarning(generation) {
    if (roarState.phase !== "warning" || generation !== roarState.generation) return;
    const attacker = roarState.attacker;
    const target = attacker === "player" ? "cpu" : "player";
    clearRoarWarning();
    roarState.phase = "effect";
    applyRoarToTarget(target);
    if (attacker === "player") showPlayerImage(roarImage, true);
    else cpu.src = cpuImages.roar;
    roarState.effectTimer = setTimeout(() => finishRoarEffect(generation, target), roarDuration);
}

function beginRoar(attacker) {
    if (matchState.finished || struggleState.active || roarState.phase ||
        (attacker === "player" && (playerRoarStunned || playerCounterStunned))) return false;
    if (attacker === "player") {
        if (roarGauge < 100 || roarInProgress) return false;
        updateEatingProgress();
        if (matchState.finished) return false;
        updateStaminaRecovery();
        if (punchPhase) cancelPunch();
        if (dodgePhase) cancelDodge();
        if (standingUp) cancelStandUp();
        if (pickupInProgress) cancelPickup();
        clearPendingRoar();
        playerState.mode = playerState.hasCarrot ? "eating" : "normal";
        playerState.sleepHitCount = 0;
        updateCarrotDisplay();
        setRoarGauge(0);
        roarInProgress = true;
        actionInProgress = true;
    } else {
        if (cpuState.roarGauge < 100 || cpuState.roarStunned || cpuState.counterStunned) return false;
        updateEatingProgress();
        if (matchState.finished) return false;
        updateCpuStaminaRecovery();
        cancelCpuActionForRoar();
        cpuState.mode = "roarWarning";
        setCpuRoarGauge(0);
    }
    roarState.phase = "warning";
    roarState.attacker = attacker;
    const generation = ++roarState.generation;
    roarWarning.dataset.target = attacker === "player" ? "cpu" : "player";
    roarWarning.hidden = false;
    roarState.warningTimer = setTimeout(() => resolveRoarWarning(generation), roarWarningDuration);
    if (attacker === "player" && (cpuState.mode === "normal" || cpuState.mode === "eating") &&
        Math.random() < cpuAi.warningCancelChance) {
        roarState.cpuCancelTimer = setTimeout(() => {
            if (generation === roarState.generation) cancelRoarWarning("cpu");
        }, cpuAi.warningReaction);
    }
    return true;
}

function playRoar() { return beginRoar("player"); }

function waitForEatingRoar(button) {
    clearPendingRoar();
    pendingRoar = { button, startedAt: performance.now() };
    pendingRoarTimer = setTimeout(clearPendingRoar, punchDurations.windup);
}

gameScreen.addEventListener("mousedown", (event) => {
    if (matchState.finished) return;
    if (struggleState.active) {
        if (event.button === 2) event.preventDefault();
        recordStrugglePlayerInput(event.button);
        return;
    }
    if (pickupInProgress && event.button === 1) {
        event.preventDefault();
        return;
    }
    if (event.button === 1) {
        event.preventDefault();
        if (cancelRoarWarning("player")) return;
        toggleSitting();
        return;
    }

    if (!punchImages[event.button]) return;
    if (pressedPunchButtons.has(event.button)) return;
    pressedPunchButtons.add(event.button);
    if (roarInProgress || playerRoarStunned || playerCounterStunned) return;
    if (pendingRoar && pendingRoar.button !== event.button &&
        performance.now() - pendingRoar.startedAt <= punchDurations.windup) {
        if (playRoar()) return;
        clearPendingRoar();
    }
    if (actionInProgress) {
        if (punchPhase === "windup") return;
        waitForEatingRoar(event.button);
        return;
    }
    if (fatigued) {
        waitForEatingRoar(event.button);
        return;
    }

    if (playerState.mode === "sleeping" || playerState.mode === "sittingEating") {
        startStandUp();
        waitForEatingRoar(event.button);
        return;
    }
    if (playerState.hasCarrot) {
        waitForEatingRoar(event.button);
        return;
    }
    startPunch(event.button);
    waitForEatingRoar(event.button);
});

window.addEventListener("mouseup", (event) => {
    struggleState.pressedButtons.delete(event.button);
    pressedPunchButtons.delete(event.button);
});

window.addEventListener("blur", () => {
    struggleState.pressedButtons.clear();
    pressedPunchButtons.clear();
    clearPendingRoar();
});

gameScreen.addEventListener("auxclick", (event) => {
    if (event.button === 1) event.preventDefault();
});

gameScreen.addEventListener("wheel", (event) => {
    event.preventDefault();
    if (matchState.finished || struggleState.active) return;
    if (event.deltaY === 0) return;
    if (actionInProgress || fatigued || playerRoarStunned || playerCounterStunned) return;

    clearPendingRoar();
    if (playerState.mode === "sleeping" || playerState.mode === "sittingEating") {
        startStandUp();
        return;
    }
    startDodge(event.deltaY < 0 ? "left" : "right");
}, { passive: false });

gameScreen.addEventListener("contextmenu", (event) => {
    event.preventDefault();
});

renderMatchClock();
startMatchClock();

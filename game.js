
const gameScreen = document.getElementById("game-screen");
const player = document.getElementById("player");
const carrot = document.getElementById("carrot");
const carrotGauge = document.getElementById("carrot-gauge");
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
const roarFill = document.querySelector(".player-gauges .roar .gauge-fill");
const staminaFill = document.querySelector(".player-gauges .stamina .gauge-fill");
const staminaTrack = staminaFill.parentElement;
const punchDurations = { windup: 180, contact: 100, recovery: 170 };
const dodgeDurations = { start: 80, pose: 140, recovery: 180 };
const standUpDuration = 250;
const standUpFrame = { image: normalImage, compactPose: false };
// 攻撃方向と必要な回避方向の対応。CPUの攻撃判定を実装するときに利用する。
const dodgeDirectionForAttack = { left: "left", right: "right" };
const roarDuration = 1000;
const eatingPercentPerSecond = 5;
const maxStamina = 10;
const punchStaminaCost = 1;
const hitStaminaCost = 1;
const naturalRecoveryInterval = 2000;
const sleepRecoveryInterval = 1000;
const sleepRecoveryAmount = 2;
const fatigueDuration = 4000;
const fatigueRecoveryStamina = 3;
let actionInProgress = false;
let punchPhase = null;
let punchTimer = null;
let punchGeneration = 0;
let dodgePhase = null;
let dodgeDirection = null;
let dodgeStartedAt = 0;
let dodgeSuccessRecorded = false;
let dodgeTimer = null;
let dodgeGeneration = 0;
let standingUp = false;
let standUpTimer = null;
let standUpGeneration = 0;
let roarInProgress = false;
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

function updateCarrotGauge() {
    carrotGauge.style.setProperty("--carrot-player-share", `${carrotState.eaten.player}%`);
    carrotGauge.style.setProperty("--carrot-cpu-share", `${carrotState.eaten.cpu}%`);
    carrotGauge.setAttribute("aria-label", `にんじん争奪ゲージ 1P ${carrotState.eaten.player.toFixed(1)}% CPU ${carrotState.eaten.cpu.toFixed(1)}%`);
    // 25%ごとの画像差し替えに使える段階。今回は画像自体は変更しない。
    carrot.dataset.eatenQuarter = Math.min(4, Math.floor((100 - carrotState.remaining) / 25));
}

function addCarrotEaten(eater, amount) {
    if (eater !== "player" && eater !== "cpu") return;
    carrotState.eaten[eater] += Math.min(carrotState.remaining, Math.max(0, amount));
    updateCarrotGauge();
}

function updateEatingProgress() {
    const now = performance.now();
    const elapsedSeconds = (now - lastEatingUpdate) / 1000;
    lastEatingUpdate = now;
    if (playerState.hasCarrot && !actionInProgress && !fatigued && carrotState.remaining > 0) {
        addCarrotEaten("player", eatingPercentPerSecond * playerState.eatingSpeedMultiplier * elapsedSeconds);
    }
}

function updateCarrotDisplay() {
    carrot.dataset.holder = carrotState.holder;
    carrot.dataset.pose = playerState.mode === "sittingEating" && !standingUp ? "sitting" : "standing";
}

updateCarrotGauge();
updateCarrotDisplay();
setInterval(updateEatingProgress, 100);

function setStamina(value) {
    stamina = Math.max(0, Math.min(maxStamina, value));
    staminaFill.style.width = `${stamina / maxStamina * 100}%`;
    staminaTrack.setAttribute("aria-label", `スタミナ ${stamina}/${maxStamina}`);
    if (stamina === maxStamina) {
        naturalRecoveryElapsed = 0;
        sleepRecoveryElapsed = 0;
    }
    if (stamina === 0 && !fatigued) enterFatigue();
}

function updateStaminaRecovery() {
    const now = performance.now();
    const elapsed = now - lastStaminaUpdate;
    lastStaminaUpdate = now;
    if (
        fatigued ||
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
    if (!fatigued) setStamina(stamina + amount);
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
    fatigueTimer = setTimeout(() => {
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
// 開発確認用。ブラウザのコンソールから呼び出し、ゲーム操作には割り当てない。
window.debugFillPlayerRoarGauge = () => setRoarGauge(100);

setInterval(() => {
    if (!fatigued && playerState.rapidRoarRecovery && roarGauge < 100) {
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
    if (!["ground", "player", "cpu"].includes(holder) || carrotState.holder === holder) return;
    if (holder === "player" && fatigued) return;
    updateEatingProgress();
    updateStaminaRecovery();
    clearPendingRoar();
    if (holder === "player" && punchPhase) cancelPunch();
    carrotState.holder = holder;
    playerState.mode = holder === "player" ? "eating" : "normal";
    playerState.sleepHitCount = 0;
    updateCarrotDisplay();
    if (!actionInProgress) showCurrentState();
}

function setCarrotHeld(held) {
    setCarrotHolder(held ? "player" : "ground");
}

// 開発用 C キー。実際の拾い判定やCPU操作には使わない。
window.addEventListener("keydown", (event) => {
    if (event.code === "KeyC" && !event.repeat && !event.ctrlKey && !event.altKey && !event.metaKey && carrotState.holder !== "cpu") {
        setCarrotHeld(!playerState.hasCarrot);
    }
});

function recordSleepHit() {
    if (playerState.mode !== "sleeping" || standingUp) return;

    playerState.sleepHitCount += 1;
    if (playerState.sleepHitCount >= 3) startStandUp();
}

// 将来のCPUパンチ命中時に呼ぶ。パンチ無敵中は被弾処理を行わない。
function receivePlayerPunchHit() {
    if (performance.now() < playerState.punchInvulnerableUntil) return false;
    recordSleepHit();
    changeStamina(-hitStaminaCost);
    return true;
}

function toggleSitting() {
    if (actionInProgress || fatigued) return;
    clearPendingRoar();
    updateStaminaRecovery();

    if (playerState.mode === "sleeping" || playerState.mode === "sittingEating") {
        startStandUp();
        return;
    }
    updateEatingProgress();
    playerState.mode = playerState.hasCarrot ? "sittingEating" : "sleeping";
    playerState.sleepHitCount = 0;
    showCurrentState();
}

function playAction(image, compactPose = false, duration = roarDuration, onComplete = null) {
    if (actionInProgress) return;

    updateEatingProgress();
    updateStaminaRecovery();
    actionInProgress = true;
    showPlayerImage(image, compactPose);

    setTimeout(() => {
        updateEatingProgress();
        updateStaminaRecovery();
        showCurrentState();
        actionInProgress = false;
        if (onComplete) onComplete();
    }, duration);
}

function startStandUp() {
    if (actionInProgress || standingUp) return;

    updateEatingProgress();
    updateStaminaRecovery();
    actionInProgress = true;
    standingUp = true;
    const generation = ++standUpGeneration;
    updateCarrotDisplay();
    showPlayerImage(standUpFrame.image, standUpFrame.compactPose);
    standUpTimer = setTimeout(() => {
        if (generation !== standUpGeneration) return;
        updateEatingProgress();
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
    if (actionInProgress || fatigued || !dodgeFrames[direction]) return;

    updateEatingProgress();
    updateStaminaRecovery();
    actionInProgress = true;
    dodgePhase = "start";
    dodgeDirection = direction;
    dodgeStartedAt = performance.now();
    dodgeSuccessRecorded = false;
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

// 将来の攻撃命中判定から呼ぶ。今回は成功を記録するだけでゲージは変更しない。
function registerSuccessfulDodge(attackDirection) {
    const withinWindow = performance.now() - dodgeStartedAt < dodgeDurations.start + dodgeDurations.pose;
    if (!withinWindow || (dodgePhase !== "start" && dodgePhase !== "pose") ||
        dodgeSuccessRecorded || dodgeDirectionForAttack[attackDirection] !== dodgeDirection) return false;

    dodgeSuccessRecorded = true;
    return true;
}

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

function startPunch(button) {
    if (actionInProgress || fatigued || stamina < punchStaminaCost || playerState.hasCarrot) return;
    updateEatingProgress();
    updateStaminaRecovery();
    actionInProgress = true;
    punchPhase = "windup";
    changeStamina(-punchStaminaCost);
    const generation = ++punchGeneration;
    const frames = punchFrames[button];
    showPlayerImage(frames.windup);

    punchTimer = setTimeout(() => {
        if (generation !== punchGeneration) return;
        punchPhase = "contact";
        showPlayerImage(frames.contact);
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

function playRoar() {
    if (roarGauge < 100 || roarInProgress) return false;

    updateEatingProgress();
    updateStaminaRecovery();
    if (punchPhase) cancelPunch();
    if (dodgePhase) cancelDodge();
    if (standingUp) cancelStandUp();
    clearPendingRoar();
    playerState.mode = playerState.hasCarrot ? "eating" : "normal";
    playerState.sleepHitCount = 0;
    updateCarrotDisplay();
    setRoarGauge(0);
    roarInProgress = true;
    playAction(roarImage, true, roarDuration, () => { roarInProgress = false; });
    return true;
}

function waitForEatingRoar(button) {
    clearPendingRoar();
    pendingRoar = { button, startedAt: performance.now() };
    pendingRoarTimer = setTimeout(clearPendingRoar, punchDurations.windup);
}

gameScreen.addEventListener("mousedown", (event) => {
    if (event.button === 1) {
        event.preventDefault();
        toggleSitting();
        return;
    }

    if (!punchImages[event.button]) return;
    if (roarInProgress) return;
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

window.addEventListener("blur", () => {
    clearPendingRoar();
});

gameScreen.addEventListener("auxclick", (event) => {
    if (event.button === 1) event.preventDefault();
});

gameScreen.addEventListener("wheel", (event) => {
    event.preventDefault();
    if (event.deltaY === 0) return;
    if (actionInProgress || fatigued) return;

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

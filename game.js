
const gameScreen = document.getElementById("game-screen");
const player = document.getElementById("player");
const cpu = document.getElementById("cpu");
const staminaEffectElements = {
    player: document.getElementById("player-stamina-effect"),
    cpu: document.getElementById("cpu-stamina-effect"),
};
const staminaEffectSettings = {
    fadeIn: 250, hold: 300, fadeOut: 450, startY: -20, endY: 20,
    player: { x: 37, y: 20 },
    cpu: [{ x: 59, y: 14 }, { x: 59, y: 14 }, { x: 60, y: 10 }],
};
const staminaEffectFrames = { player: null, cpu: null };
let cpuNormalImage = cpu.getAttribute("src");
const cpuHitMark = document.getElementById("cpu-hit-mark");
const playerHitMark = document.getElementById("player-hit-mark");
const roarWarning = document.getElementById("roar-warning");
const firstHitLabel = document.getElementById("first-hit-label");
const battleTimer = document.getElementById("battle-timer");
const finishLabel = document.getElementById("finish-label");
const resultLabel = document.getElementById("result-label");
const cpuStaminaFill = document.querySelector(".cpu-gauges .stamina .gauge-fill");
const cpuStaminaTrack = cpuStaminaFill.parentElement;
const cpuRoarFill = document.querySelector(".cpu-gauges .roar .gauge-fill");
let cpuImages = {};
const stageLabel = document.getElementById("stage-label");
const startLabel = document.getElementById("start-label");
const startImage = document.getElementById("start-image");
const titleScreen = document.getElementById("title-screen");
const titleMessage = document.getElementById("title-message");
const startButton = document.getElementById("start-button");
const twoPlayerButton = document.getElementById("two-player-button");
const twoPlayerHelp = document.getElementById("two-player-help");
const twoPlayerStart = document.getElementById("two-player-start");
const twoPlayerBack = document.getElementById("two-player-back");
const recordsButton = document.getElementById("records-button");
const scoreScreen = document.getElementById("score-screen");
const scoreHeading = document.getElementById("score-heading");
const scoreDetails = document.getElementById("score-details");
const scoreContinue = document.getElementById("score-continue");
const entryScreen = document.getElementById("entry-screen");
const totalScoreLabel = document.getElementById("total-score");
const recordForm = document.getElementById("record-form");
const recordName = document.getElementById("record-name");
const recordError = document.getElementById("record-error");
const rankingScreen = document.getElementById("ranking-screen");
const rankingList = document.getElementById("ranking-list");
const rankingBack = document.getElementById("ranking-back");
const carrot = document.getElementById("carrot");
const carrotGauge = document.getElementById("carrot-gauge");
const struggleUi = document.getElementById("struggle-ui");
const struggleTime = document.getElementById("struggle-time");
const strugglePlayerScore = document.getElementById("struggle-player-score");
const struggleCpuScore = document.getElementById("struggle-cpu-score");
const struggleFeedback = document.getElementById("struggle-feedback");
const struggleTwoPlayerFeedback = document.getElementById("struggle-2p-feedback");
const struggleInstruction = document.getElementById("struggle-instruction");
const struggleOpponentLabel = document.getElementById("struggle-opponent-label");
const normalImage = player.getAttribute("src");
const sittingImage = "assets/characters/player/sit/Sit_1P.png";
const sleepingImage = "assets/characters/player/sleep/Sleep_1P.png";
const sleepingBubbleImage = "assets/characters/player/sleep/Sleep2_1P.png";
const eatingImages = { standing: "assets/characters/player/eat/eat1_1P.png", sitting: "assets/characters/player/eat/eat2_1P.png" };
const punchImages = {
    0: "assets/characters/player/punch/Punch_Left_1P.png",
    2: "assets/characters/player/punch/Punch_Right_1P.png",
};
// 全画面PNGの位置は画面に対する割合（cqw / cqh）。コピー数や移動幅も調整できる。
const actionTimeScale = 1.3;
const actionTimings = {
    punch: {
        left: { windup: 180, hold: 84, contact: 100, recovery: 170 },
        right: { windup: 300, hold: 140, contact: 100, recovery: 120 },
    },
    dodge: { windup: 80, hold: 35, contact: 140, recovery: 180 },
};
function scaledActionTiming(timing) {
    return Object.fromEntries(Object.entries(timing).map(([key, value]) => [key, Math.round(value * actionTimeScale)]));
}
const punchWarningDuration = 650;
const punchTimings = {
    left: { ...scaledActionTiming(actionTimings.punch.left), windup: punchWarningDuration },
    right: { ...scaledActionTiming(actionTimings.punch.right), windup: punchWarningDuration },
};
const dodgeTiming = { windup: 50, hold: 0, contact: 330, recovery: 100 };
const punchVisualSettings = {
    arcWidth: 0.6, playerForwardX: 3, cpuForwardX: -3, playerForward: -2, cpuForward: 2,
    playerScale: 0.8, cpuScale: 1.2, playerOriginX: 37, cpuOriginX: 59,
    playerHead: { stand: 287, left: 286, right: 283 },
    cpuHead: [
        { stand: 236, left: 234, right: 234 },
        { stand: 224, left: 225, right: 221 },
        { stand: 176, left: 220, right: 176 },
    ],
    sampleInterval: 55, trailLifetime: 220, copies: 3, opacity: 0.32,
};
const rightPunchMotion = {
    ...punchTimings.right, windupHold: punchTimings.right.hold,
    layers: [
        { image: "assets/characters/player/stand/Stand_afterimage_1P.png", copies: 3, opacity: 0.5, fade: "out", fadeStart: 0, fadeEnd: 0.375, offsetX: -0.7, offsetY: 0 },
        { image: "assets/characters/player/punch/Punch_Right_afterimage_1P.png", copies: 3, opacity: 0.5, fade: "in", fadeStart: 0.25, fadeEnd: 1, offsetX: 0.7, offsetY: 0 },
    ],
};
function makeMotionConfig(image, direction, windup, windupHold, contact, recovery) {
    return {
        windup, windupHold, contact, recovery,
        layers: [
            { image: "assets/characters/player/stand/Stand_afterimage_1P.png", copies: 3, opacity: 0.5, fade: "out", fadeStart: 0, fadeEnd: 0.375, offsetX: -0.7 * direction, offsetY: 0 },
            { image, copies: 3, opacity: 0.5, fade: "in", fadeStart: 0.25, fadeEnd: 1, offsetX: 0.7 * direction, offsetY: 0 },
        ],
    };
}
const leftPunchMotion = makeMotionConfig("assets/characters/player/punch/Punch_Left_1P_afterimage.png", -1, punchTimings.left.windup, punchTimings.left.hold, punchTimings.left.contact, punchTimings.left.recovery);
const dodgeImages = {
    left: "assets/characters/player/dodge/Dodge_Left_1P.png",
    right: "assets/characters/player/dodge/Dodge_Right_1P.png",
};
const dodgeMotions = {
    left: makeMotionConfig("assets/characters/player/dodge/Dodge_Left_afterimage_1P.png", -1, dodgeTiming.windup, dodgeTiming.hold, dodgeTiming.contact, dodgeTiming.recovery),
    right: makeMotionConfig("assets/characters/player/dodge/Dodge_Right_afterimage_1P.png", 1, dodgeTiming.windup, dodgeTiming.hold, dodgeTiming.contact, dodgeTiming.recovery),
};
const roarImage = "assets/characters/player/roar/Roar_1P.png";
const sitAfterimage1 = normalImage;
const sitAfterimage2 = "assets/characters/player/sit/Sit_1P.png";
const sittingMotion = { duration: 300, rotation: 5, scaleY: 0.9, moveDown: 0.5, originX: 37, originY: 100 };
const sleepingMotion = {
    duration: 300, rotation: 4, scaleY: 0.95, moveDown: 0.5, originX: 37, originY: 100,
    breathPeriod: 2500, breathRotation: 0.5, breathMoveY: 1, breathScaleY: 0.01,
    bubbleScaleMin: 0.6, bubbleScaleMax: 1, bubbleOriginX: 36.4, bubbleOriginY: 48,
    bubbleClip: "ellipse(6.9% 12.2% at 42.6% 39.5%)",
};
const pickupMotion = { duration: 300, rotation: 7, scaleY: 0.9, moveDown: 0.5, originX: 37, originY: 100 };
const roarMotion = { duration: 250, rotation: -6, scaleY: 1.05, moveDown: -0.3, originX: 37, originY: 100, hold: 500, shakePx: 2.5, shakePeriod: 80 };
const standingFrames = [
    { image: sittingImage, duration: 50, compactPose: true },
    { image: sitAfterimage2, duration: 100, fullFrame: true },
    { image: sitAfterimage1, duration: 100, fullFrame: true },
];
const pickupImage = "assets/characters/player/pick up/Pick up_1P.png";
const roarFill = document.querySelector(".player-gauges .roar .gauge-fill");
const staminaFill = document.querySelector(".player-gauges .stamina .gauge-fill");
const staminaTrack = staminaFill.parentElement;
const dodgeDurations = { start: dodgeTiming.windup, pose: dodgeTiming.contact, recovery: dodgeTiming.recovery };
const roarInputWindow = 180;
const standUpDuration = 250;
const pickupDuration = 450;
const firstHitDisplayDuration = 800;
const openingHitWindow = 16;
// 攻撃方向と必要な回避方向の対応。CPUの攻撃判定を実装するときに利用する。
const dodgeDirectionForAttack = { left: "left", right: "right" };
const roarDuration = 1000;
const matchDuration = 100000;
const finishDisplayDuration = 1200;
const resultDisplayDuration = 2200;
const stageIntroDuration = 1500;
const fightIntroDuration = 800;
const roarWarningDuration = 600;
const roarTargetLockDuration = 2000; // 演出の1秒と合わせて3秒
const roarCounterLockDuration = 2000;
const eatingPercentPerSecond = 5;
const maxStamina = 10;
const punchStaminaCost = 0.75;
const dodgeStaminaCost = 1;
const hitStaminaCost = 1;
const dodgeRoarGain = 5;
const punchInvulnerabilityDuration = 1500;
const carrotRepickupDelay = 800;
const naturalRecoveryInterval = 1000;
const sleepRecoveryInterval = 1000;
const sleepRecoveryAmount = 2;
const fatigueDuration = 4000;
const fatigueRecoveryStamina = 3;
// A・Bの数値はゲームバランス調整前の暫定値。
const cpuProfiles = {
 C: {
    tick: 50, pickupDelayMin: 50, pickupDelayMax: 200,
    decisionMin: 750, decisionMax: 1300,
    dodgeChance: 0.3, dodgeReaction: 140,
    sitChance: 0.25, sitMin: 1600, sitMax: 2800,
    sleepThreshold: 4, wakeStamina: 8,
    roarChance: 0.25, warningCancelChance: 0.2, warningReaction: 420,
 },
 A: { tick: 50, pickupDelayMin: 30, pickupDelayMax: 120, decisionMin: 500, decisionMax: 850,
    dodgeChance: 0.55, dodgeReaction: 105, sitChance: 0.3, sitMin: 1400, sitMax: 2400,
    sleepThreshold: 3, wakeStamina: 8, roarChance: 0.5, warningCancelChance: 0.45, warningReaction: 300 },
 B: { tick: 50, pickupDelayMin: 10, pickupDelayMax: 80, decisionMin: 300, decisionMax: 550,
    dodgeChance: 0.75, dodgeReaction: 65, sitChance: 0.35, sitMin: 1200, sitMax: 2200,
    sleepThreshold: 3, wakeStamina: 8, roarChance: 0.75, warningCancelChance: 0.7, warningReaction: 190 },
};
const stages = [
    { name: "STAGE 1", rank: "C", character: "ノーマル", background: "リビング", label: "STAGE_1.png" },
    { name: "STAGE 2", rank: "A", character: "軍曹", background: "草原", label: "STAGE_2.png" },
    { name: "FINAL STAGE", rank: "B", character: "チャンピオン", background: "リング", label: "STAGE_3.png" },
];
let stageIndex = 0;
let gameMode = "cpu";
const twoPlayerKeys = new Set();
const twoPlayerRoarHoldDuration = 350;
let twoPlayerRoarTimer = null;
let cpuAi = cpuProfiles.C;
const rankingKey = "marmot-cpu-records-v1";
const runScore = { stages: [], eligible: true };
let matchScore = { hitsTaken: 0, punchesLanded: 0, result: null };
const struggleDuration = 3000;
const struggleCpuProfiles = {
    C: { tapMin: 400, tapMax: 600, missChance: 0.3 },
    A: { tapMin: 300, tapMax: 450, missChance: 0.18 },
    B: { tapMin: 220, tapMax: 350, missChance: 0.08 },
};
let struggleCpuProfile = struggleCpuProfiles.C;
let actionInProgress = false;
let punchPhase = null;
let punchTimer = null;
let punchGeneration = 0;
const playerVisual = { frame: null, generation: 0, layers: [], className: "has-motion-ghosts" };
const cpuVisual = { frame: null, generation: 0, layers: [], className: "has-cpu-motion-ghosts" };
const cpuMotionOffsets = new Map();
const pressedPunchButtons = new Set();
let dodgePhase = null;
let dodgeDirection = null;
let dodgeStartedAt = 0;
let dodgeTimer = null;
let dodgeGeneration = 0;
let dodgeRefunded = false;
let dodgeCausedFatigue = false;
let dodgeVisualTimer = null;
let dodgeVisualGeneration = 0;
let standingUp = false;
let standUpTimer = null;
let standUpGeneration = 0;
let poseVisualTimer = null;
let poseVisualGeneration = 0;
let poseVisualFrame = null;
let sleepingBubbleLayer = null;
let eatingVisualFrame = null;
let eatingVisualGeneration = 0;
let eatingVisualBlocked = false;
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
    dodgeRefunded: false,
    dodgeCausedFatigue: false,
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
const cpuPose = { frame: null, generation: 0, kind: null };
const cpuPoseAdjustments = [
    { originX: 59, originY: 92, direction: -1 },
    { originX: 59, originY: 92, direction: -1 },
    { originX: 60, originY: 94, direction: -1 },
];
let playerHitEffectTimer = null;
const roarState = { phase: null, attacker: null, generation: 0, warningTimer: null, effectTimer: null, cpuCancelTimer: null };
const struggleState = {
    active: false, generation: 0, endsAt: 0,
    playerGood: 0, cpuGood: 0,
    lastPlayerButton: null, lastCpuButton: null,
    finishTimer: null, displayTimer: null, cpuTimer: null,
};
let struggleAudioContext = null;
let dodgeSoundContext = null;
let struggleMusicTimer = null;
let struggleMusicStep = 0;
const matchState = {
    remainingMs: matchDuration, lastTickAt: performance.now(), clockTimer: null,
    finished: false, winner: null, reason: null, generation: 0,
    finishTimer: null, resultTimer: null,
};
const openingState = {
    active: true,
    claimant: null,
    pendingHits: new Set(),
    adjudicationTimer: null,
    feedbackTimer: null,
};

function unlockDodgeSound() {
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        if (!dodgeSoundContext) dodgeSoundContext = new AudioContextClass();
        if (dodgeSoundContext.state === "suspended") dodgeSoundContext.resume().catch(() => {});
    } catch (error) { /* 音声が使えない場合も判定には影響させない。 */ }
}

function playDodgeSuccessSound() {
    if (!dodgeSoundContext || dodgeSoundContext.state !== "running") return;
    try {
        const now = dodgeSoundContext.currentTime;
        const oscillator = dodgeSoundContext.createOscillator();
        const gain = dodgeSoundContext.createGain();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(650, now);
        oscillator.frequency.exponentialRampToValueAtTime(1050, now + 0.09);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.035, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
        oscillator.connect(gain).connect(dodgeSoundContext.destination);
        oscillator.start(now);
        oscillator.stop(now + 0.13);
    } catch (error) { /* 音声は表示・判定と独立させる。 */ }
}

window.addEventListener("pointerdown", unlockDodgeSound, { once: true });
window.addEventListener("keydown", unlockDodgeSound, { once: true });
window.addEventListener("wheel", unlockDodgeSound, { once: true, passive: true });

function configureStage(index) {
    stageIndex = index;
    const stage = stages[index];
    cpuAi = cpuProfiles[stage.rank];
    struggleCpuProfile = struggleCpuProfiles[stage.rank];
    const cpuAssets = [
        { folder: "1_Normal", stand: "Stand_enemy.png", roar: "Roar_1.png", leftPunch: "Punch_Left_1.png", rightPunch: "Punch_Right_enemy.png", leftDodge: "Dodge_Left_enemy.png", rightDodge: "Dodge_Right_enemy.png", pickup: "Pick up_1.png", sit: "Sit_1.png", sleep: "Sleep1_enemy.png", sleep2: "Sleep2_enemy.png", eat1: "Eat_1.png", eat2: "Eat_2.png" },
        { folder: "2_Army", stand: "Stand_enemy2.png", roar: "Roar_enemy2.png", leftPunch: "Punch_left_enemy2.png", rightPunch: "Punch_Right_enemy2.png", leftDodge: "Dodge_Left_enemy2.png", rightDodge: "Dodge_Right_enemy2.png", pickup: "Pick up_enemy2.png", sit: "Sit_enemy2.png", sleep: "Sleep_enemy2.png", sleep2: "Sleep2_enemy2.png", eat1: "Eat_1_enemy2.png", eat2: "Eat_2_enemy2.png" },
        { folder: "3_Champion", stand: "Stand_enemy3.png", roar: "Roar_enemy3.png", leftPunch: "Punch_Left_enemy3.png", rightPunch: "Punch_Right_enemy3.png", leftDodge: "Dodge_Left_enemy3.png", rightDodge: "Dodge_Right_enemy3.png", pickup: "Pick up_enemy3.png", sit: "Sit_enemy3.png", sleep: "Sleep_enemy3.png", sleep2: "Sleep2_enemy3.png", eat1: "Eat_1_enemy3.png", eat2: "Eat_2_enemy3.png" },
    ][index];
    const asset = (action, file) => `assets/characters/cpu/${cpuAssets.folder}/${action}/${file}`;
    cpuNormalImage = asset("stand", cpuAssets.stand);
    cpuImages = {
        roar: asset("roar", cpuAssets.roar),
        punch: { left: asset("punch", cpuAssets.leftPunch), right: asset("punch", cpuAssets.rightPunch) },
        dodge: { left: asset("dodge", cpuAssets.leftDodge), right: asset("dodge", cpuAssets.rightDodge) },
        pickup: asset("pick up", cpuAssets.pickup), sit: asset("sit", cpuAssets.sit), sleep: asset("sleep", cpuAssets.sleep),
        sleep2: asset("sleep", cpuAssets.sleep2), eat: { standing: asset("eat", cpuAssets.eat1), sitting: asset("eat", cpuAssets.eat2) },
    };
    const suffix = index === 0 ? "enemy" : `enemy${index + 1}`;
    cpuImages.afterimage = {
        stand: index === 0 ? cpuNormalImage : asset("stand", `Stand_afterimage_${suffix}.png`),
        punch: { left: asset("punch", `Punch_${index === 1 ? "left" : "Left"}_afterimage_${suffix}.png`), right: asset("punch", `Punch_Right_afterimage_${suffix}.png`) },
        dodge: { left: asset("dodge", `Dodge_Left_afterimage_${suffix}.png`), right: asset("dodge", `Dodge_Right_afterimage_${suffix}.png`) },
    };
    prepareCpuMotionImages(cpuImages.afterimage);
    gameScreen.style.backgroundImage = `url("assets/backgrounds/背景_${stage.background}.png")`;
    stageLabel.src = `assets/stage/${stage.label}`;
    stageLabel.alt = stage.name;
}

function showTitle(message) {
    startLabel.hidden = true;
    resultLabel.hidden = true;
    scoreScreen.hidden = true;
    entryScreen.hidden = true;
    rankingScreen.hidden = true;
    twoPlayerHelp.hidden = true;
    titleMessage.textContent = message;
    titleScreen.hidden = false;
    startButton.focus();
}

function resetRunScore() {
    runScore.stages = [];
    runScore.eligible = true;
}

function calculateStageScore(winner, remainingMs, hitsTaken, punchesLanded) {
    const remainingSeconds = Math.floor(Math.max(0, Math.min(matchDuration, remainingMs)) / 1000);
    const victory = winner === "player" ? 4000 : 0;
    const time = remainingSeconds * 30;
    const defense = Math.max(0, 2000 - hitsTaken * 200);
    const attack = Math.min(1000, punchesLanded * 100);
    return { victory, time, defense, attack, remainingSeconds, hitsTaken, punchesLanded,
        elapsedMs: matchDuration - Math.max(0, Math.min(matchDuration, remainingMs)),
        total: Math.min(10000, victory + time + defense + attack) };
}

function showStageScore() {
    const score = matchScore.result;
    scoreHeading.textContent = `${stages[stageIndex].name}  SCORE  ${score.total.toLocaleString()}`;
    scoreDetails.textContent = "";
    for (const line of [
        `勝利ボーナス　${score.victory.toLocaleString()}点`,
        `タイムボーナス（残り${score.remainingSeconds}秒）　${score.time.toLocaleString()}点`,
        `被弾ボーナス（${score.hitsTaken}回）　${score.defense.toLocaleString()}点`,
        `攻撃命中ボーナス（${score.punchesLanded}回）　${score.attack.toLocaleString()}点`,
    ]) {
        const row = document.createElement("p");
        row.textContent = line;
        scoreDetails.appendChild(row);
    }
    scoreScreen.hidden = false;
    scoreContinue.focus();
}

function loadRecords() {
    try {
        const records = JSON.parse(localStorage.getItem(rankingKey) || "[]");
        return Array.isArray(records) ? records.filter(record => record && typeof record.name === "string" &&
            Number.isFinite(record.total) && Number.isFinite(record.elapsedMs) &&
            typeof record.registeredAt === "string" && Array.isArray(record.stages)) : [];
    } catch (_) { return []; }
}

function sortRecords(records) {
    return records.sort((a, b) => b.total - a.total || a.elapsedMs - b.elapsedMs ||
        a.registeredAt.localeCompare(b.registeredAt)).slice(0, 10);
}

function showRanking() {
    titleScreen.hidden = true;
    entryScreen.hidden = true;
    rankingList.textContent = "";
    const records = sortRecords(loadRecords());
    if (!records.length) rankingList.textContent = "まだレコードがありません";
    records.forEach((record, index) => {
        const row = document.createElement("div");
        row.className = "ranking-row";
        for (const value of [`${index + 1}位`, record.name, `${record.total.toLocaleString()}点`, `${(record.elapsedMs / 1000).toFixed(1)}秒`]) {
            const cell = document.createElement("span");
            cell.textContent = value;
            row.appendChild(cell);
        }
        rankingList.appendChild(row);
    });
    rankingScreen.hidden = false;
    rankingBack.focus();
}

function clearOpeningTimers() {
    clearTimeout(openingState.adjudicationTimer);
    openingState.adjudicationTimer = null;
    openingState.pendingHits.clear();
    clearTimeout(openingState.feedbackTimer);
    openingState.feedbackTimer = null;
    firstHitLabel.hidden = true;
}

function releaseOpeningClaim(owner) {
    if (openingState.active && openingState.claimant === owner) openingState.claimant = null;
}

function finishOpening() {
    openingState.active = false;
    openingState.claimant = null;
    clearTimeout(openingState.adjudicationTimer);
    openingState.adjudicationTimer = null;
    openingState.pendingHits.clear();
}

function recordOpeningHit(attacker) {
    if (matchState.finished || !openingState.active || openingState.claimant || carrotState.holder !== "ground") return;
    openingState.pendingHits.add(attacker);
    if (openingState.adjudicationTimer !== null) return;
    const round = matchState.generation;
    openingState.adjudicationTimer = setTimeout(() => {
        openingState.adjudicationTimer = null;
        if (matchState.finished || round !== matchState.generation || !openingState.active ||
            openingState.claimant || carrotState.holder !== "ground") {
            openingState.pendingHits.clear();
            return;
        }
        const winner = openingState.pendingHits.size === 1 ? [...openingState.pendingHits][0] : null;
        openingState.pendingHits.clear();
        if (!winner) return; // 同じ判定窓で双方が命中した場合は次のHITを待つ。
        openingState.claimant = winner;
        firstHitLabel.hidden = false;
        clearTimeout(openingState.feedbackTimer);
        openingState.feedbackTimer = setTimeout(() => {
            if (round !== matchState.generation) return;
            firstHitLabel.hidden = true;
            openingState.feedbackTimer = null;
        }, firstHitDisplayDuration);
    }, openingHitWindow);
}

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
    cancelPoseVisual();
    clearStaminaEffect("player");
    clearStaminaEffect("cpu");
    stopCpuPose();
    eatingVisualBlocked = false;
    clearMotionVisual();
    clearMotionVisual(cpuVisual);
    clearTwoPlayerInput();
    clearOpeningTimers();
    clearPendingRoar();
    clearTimeout(punchTimer);
    punchTimer = null;
    punchPhase = null;
    punchGeneration += 1;
    clearTimeout(dodgeTimer);
    dodgeTimer = null;
    clearTimeout(dodgeVisualTimer);
    dodgeVisualTimer = null;
    dodgeVisualGeneration += 1;
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
    carrot.classList.remove("is-hit");
    cpuHitMark.classList.remove("is-visible");
    playerHitMark.classList.remove("is-visible");
}

function finishMatch(winner, reason) {
    if (matchState.finished) return false;
    if (matchState.clockTimer && !struggleState.active) {
        matchState.remainingMs = Math.max(0, matchState.remainingMs - (performance.now() - matchState.lastTickAt));
        matchState.lastTickAt = performance.now();
    }
    if (gameMode === "cpu") {
        matchScore.result = calculateStageScore(winner, matchState.remainingMs, matchScore.hitsTaken, matchScore.punchesLanded);
        runScore.stages[stageIndex] = matchScore.result;
        if (winner !== "player") runScore.eligible = false;
    }
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
        resultLabel.textContent = gameMode === "2p" ? (winner === "player" ? "1P WIN" : winner === "cpu" ? "2P WIN" : "DRAW") :
            winner === "player" ? "WIN" : winner === "cpu" ? "LOSE" : "DRAW";
        resultLabel.dataset.result = winner === "player" ? "win" : winner === "cpu" ? "lose" : "draw";
        resultLabel.hidden = false;
        matchState.resultTimer = setTimeout(() => {
            if (generation !== matchState.generation) return;
            resultLabel.hidden = true;
            if (gameMode === "2p") {
                showTitle("2P対戦終了！");
            } else if (winner === "player") {
                showStageScore();
            } else if (winner === null) {
                startStage(stageIndex);
            } else {
                showTitle("連戦終了　また挑戦してね！");
            }
        }, resultDisplayDuration);
    }, finishDisplayDuration);
    return true;
}

function startStage(index) {
    stopMatchClock();
    stopBattleActions();
    clearTimeout(matchState.finishTimer);
    clearTimeout(matchState.resultTimer);
    matchState.finishTimer = null;
    matchState.resultTimer = null;
    matchState.generation += 1;
    matchState.finished = true;
    configureStage(index);
    matchScore = { hitsTaken: 0, punchesLanded: 0, result: null };
    scoreScreen.hidden = true;
    titleScreen.hidden = true;
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
    openingState.active = true;
    openingState.claimant = null;
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
    startLabel.hidden = true;
    void startLabel.offsetWidth; // 同じ演出を途中で再開した場合もアニメーションを先頭から再生する。
    startLabel.dataset.phase = "stage";
    startImage.src = `assets/stage/${stages[index].label}`;
    startImage.alt = stages[index].name;
    startLabel.hidden = false;
    const generation = matchState.generation;
    matchState.finishTimer = setTimeout(() => {
        if (generation !== matchState.generation) return;
        startLabel.dataset.phase = "fight";
        startImage.src = "assets/stage/FIGHT.png";
        startImage.alt = "FIGHT!";
        matchState.finishTimer = setTimeout(() => {
            if (generation !== matchState.generation) return;
            startLabel.hidden = true;
            matchState.finishTimer = null;
            const now = performance.now();
            lastEatingUpdate = now;
            lastStaminaUpdate = now;
            cpuState.lastStaminaUpdate = now;
            cpuState.nextDecisionAt = now + 500;
            cpuState.nextRoarDecisionAt = now + 500;
            cpuState.nextPickupAt = now + cpuRandomBetween(cpuAi.pickupDelayMin, cpuAi.pickupDelayMax);
            matchState.finished = false;
            startMatchClock();
        }, fightIntroDuration);
    }, stageIntroDuration);
}

function restartStage1() { resetRunScore(); startStage(0); }
window.debugRestartStage1 = restartStage1;

function receiveCpuPunchHit(punchId, attackDirection) {
    if (matchState.finished || struggleState.active) return false;
    if (punchId !== punchGeneration || cpuState.lastResolvedPunch === punchId) return false;

    cpuState.lastResolvedPunch = punchId;
    if (performance.now() < cpuState.punchInvulnerableUntil) return false;
    if (registerCpuDodge(attackDirection)) {
        refundCpuDodge();
        playDodgeSuccessSound();
        setCpuRoarGauge(cpuState.roarGauge + dodgeRoarGain);
        return false;
    }
    updateEatingProgress();
    if (matchState.finished) return false;
    stopCpuPose();
    cpuState.dodgeCausedFatigue = false;
    matchScore.punchesLanded += 1;
    if (cpuState.mode === "picking") cancelCpuPickup();
    if (cpuState.mode === "sleeping" && ++cpuState.sleepHitCount >= 3) startCpuStandUp();
    const carrotDropHits = cpuState.mode === "sittingEating" ? 2 : 3;
    cpuState.punchHitCount += 1;
    changeCpuStamina(-hitStaminaCost);

    clearTimeout(cpuHitEffectTimer);
    cpu.classList.remove("is-hit");
    cpuHitMark.classList.remove("is-visible");
    void cpu.offsetWidth;
    cpu.classList.add("is-hit");
    cpuHitMark.classList.add("is-visible");
    cpuHitEffectTimer = setTimeout(() => {
        updateEatingProgress();
        cpu.classList.remove("is-hit");
        cpuHitMark.classList.remove("is-visible");
        cpuHitEffectTimer = null;
        if (["sleeping", "sittingEating", "eating"].includes(cpuState.mode)) showCpuCurrentState();
    }, 280);
    if (carrotState.holder === "cpu" && cpuState.punchHitCount >= carrotDropHits) dropCarrot("cpu", "punch");
    recordOpeningHit("player");
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
    if (playerState.hasCarrot && playerHitEffectTimer === null && !actionInProgress && !fatigued && !playerRoarStunned && !playerCounterStunned && carrotState.remaining > 0) {
        addCarrotEaten("player", eatingPercentPerSecond * playerState.eatingSpeedMultiplier * elapsedSeconds);
    }
    if (matchState.finished) return;
    if (carrotState.holder === "cpu" && cpuHitEffectTimer === null && !cpuState.fatigued && !cpuState.roarStunned && !cpuState.counterStunned &&
        (cpuState.mode === "eating" || cpuState.mode === "sittingEating") && carrotState.remaining > 0) {
        addCarrotEaten("cpu", eatingPercentPerSecond *
            (cpuState.mode === "sittingEating" ? 2 : 1) * elapsedSeconds);
    }
}

function updateCarrotDisplay() {
    carrot.dataset.holder = carrotState.holder;
    if (carrotState.holder !== "player") carrot.classList.remove("is-hit");
    carrot.classList.toggle("is-player-action-hidden", carrotState.holder === "player" &&
        (punchPhase !== null || dodgePhase !== null));
    const isSitting = carrotState.holder === "player"
        ? playerState.mode === "sittingEating" && !standingUp
        : carrotState.holder === "cpu" && cpuState.mode === "sittingEating";
    carrot.dataset.pose = isSitting ? "sitting" : "standing";
}

updateCarrotGauge();
updateCarrotDisplay();

function clearStaminaEffect(side) {
    if (staminaEffectFrames[side] !== null) cancelAnimationFrame(staminaEffectFrames[side]);
    staminaEffectFrames[side] = null;
    const element = staminaEffectElements[side];
    element.hidden = true;
    element.style.opacity = "";
    element.style.transform = "";
}

function playStaminaEffect(side) {
    clearStaminaEffect(side);
    const element = staminaEffectElements[side];
    const settings = staminaEffectSettings;
    const position = side === "player" ? settings.player : settings.cpu[stageIndex];
    element.style.left = `${position.x}cqw`;
    element.style.top = `${position.y}cqh`;
    element.style.opacity = "0";
    element.style.transform = `translate(-50%, ${settings.startY}px)`;
    element.hidden = false;
    const started = performance.now();
    const ease = (t) => t * t * (3 - 2 * t);
    const render = (now) => {
        const elapsed = now - started;
        let opacity, offset;
        if (elapsed < settings.fadeIn) {
            const p = ease(Math.max(0, elapsed / settings.fadeIn));
            opacity = p;
            offset = settings.startY * (1 - p);
        } else if (elapsed < settings.fadeIn + settings.hold) {
            opacity = 1;
            offset = 0;
        } else if (elapsed < settings.fadeIn + settings.hold + settings.fadeOut) {
            const p = ease((elapsed - settings.fadeIn - settings.hold) / settings.fadeOut);
            opacity = 1 - p;
            offset = settings.endY * p;
        } else {
            clearStaminaEffect(side);
            return;
        }
        element.style.opacity = String(opacity);
        element.style.transform = `translate(-50%, ${offset}px)`;
        staminaEffectFrames[side] = requestAnimationFrame(render);
    };
    staminaEffectFrames[side] = requestAnimationFrame(render);
}

function setStamina(value, triggerFatigue = true) {
    const previous = stamina;
    stamina = Math.max(0, Math.min(maxStamina, value));
    if (previous > 0 && stamina === 0) playStaminaEffect("player");
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

function showPlayerImage(image, compactPose = false, fullFrame = false, position = null) {
    player.src = image;
}

function showCurrentState() {
    const isSitting = playerState.mode === "sleeping" || playerState.mode === "sittingEating";
    const image = playerState.hasCarrot ? (isSitting ? eatingImages.sitting : eatingImages.standing) : (playerState.mode === "sleeping" ? sleepingImage : normalImage);
    showPlayerImage(image, isSitting);
    updateCarrotDisplay();
    syncEatingVisual();
}

function stopEatingVisual() {
    if (eatingVisualFrame !== null) {
        cancelAnimationFrame(eatingVisualFrame);
        eatingVisualFrame = null;
        player.style.transform = "";
    }
    eatingVisualGeneration += 1;
}

function syncEatingVisual() {
    stopEatingVisual();
}

function cancelPoseVisual() {
    stopEatingVisual();
    clearTimeout(poseVisualTimer);
    poseVisualTimer = null;
    if (poseVisualFrame !== null) cancelAnimationFrame(poseVisualFrame);
    poseVisualFrame = null;
    if (sleepingBubbleLayer) sleepingBubbleLayer.remove();
    sleepingBubbleLayer = null;
    player.style.transform = "";
    player.style.transformOrigin = "";
    poseVisualGeneration += 1;
}

function playInterpolatedPose(motion, initialImage, onComplete, reverse = false) {
    cancelPoseVisual();
    const generation = poseVisualGeneration;
    const startedAt = performance.now();
    showPlayerImage(initialImage);
    player.style.transformOrigin = `${motion.originX}% ${motion.originY}%`;
    const render = (now) => {
        if (generation !== poseVisualGeneration || matchState.finished) return;
        const progress = Math.min(1, Math.max(0, (now - startedAt) / motion.duration));
        const interpolation = progress * progress * (3 - 2 * progress);
        const eased = reverse ? 1 - interpolation : interpolation;
        const angle = motion.rotation * eased;
        const scale = 1 + (motion.scaleY - 1) * eased;
        const down = motion.moveDown * eased;
        player.style.transform = `translateY(${down}cqh) rotate(${angle}deg) scaleY(${scale})`;
        if (progress < 1) poseVisualFrame = requestAnimationFrame(render);
        else {
            poseVisualFrame = null;
            player.style.transform = "";
            player.style.transformOrigin = "";
            onComplete();
        }
    };
    if (reverse) render(startedAt);
    else poseVisualFrame = requestAnimationFrame(render);
}

function startSleepBreathing() {
    if (matchState.finished || playerState.mode !== "sleeping" || standingUp || fatigued || playerRoarStunned || playerCounterStunned) return;
    showPlayerImage(sittingImage);
    if (sleepingBubbleLayer) sleepingBubbleLayer.remove();
    sleepingBubbleLayer = document.createElement("div");
    sleepingBubbleLayer.className = "sleep-bubble-layer";
    sleepingBubbleLayer.setAttribute("aria-hidden", "true");
    const bubble = document.createElement("img");
    bubble.src = sleepingBubbleImage;
    bubble.alt = "";
    bubble.style.clipPath = sleepingMotion.bubbleClip;
    bubble.style.transformOrigin = `${sleepingMotion.bubbleOriginX}% ${sleepingMotion.bubbleOriginY}%`;
    sleepingBubbleLayer.appendChild(bubble);
    gameScreen.appendChild(sleepingBubbleLayer);
    const origin = `${sleepingMotion.originX}% ${sleepingMotion.originY}%`;
    player.style.transformOrigin = origin;
    sleepingBubbleLayer.style.transformOrigin = origin;
    const generation = poseVisualGeneration;
    const startedAt = performance.now();
    const render = (now) => {
        if (generation !== poseVisualGeneration || matchState.finished || playerState.mode !== "sleeping" || standingUp) return;
        const phase = (now - startedAt) * 2 * Math.PI / sleepingMotion.breathPeriod;
        const eased = (1 - Math.cos(phase)) / 2;
        const offset = -sleepingMotion.breathMoveY * eased;
        const rotation = sleepingMotion.breathRotation * eased;
        const scale = 1 + sleepingMotion.breathScaleY * eased;
        const transform = `translateY(${offset}px) rotate(${rotation}deg) scaleY(${scale})`;
        player.style.transform = transform;
        sleepingBubbleLayer.style.transform = transform;
        const bubbleScale = sleepingMotion.bubbleScaleMin + (sleepingMotion.bubbleScaleMax - sleepingMotion.bubbleScaleMin) * eased;
        bubble.style.transform = `scale(${bubbleScale})`;
        poseVisualFrame = requestAnimationFrame(render);
    };
    bubble.style.transform = `scale(${sleepingMotion.bubbleScaleMin})`;
    poseVisualFrame = requestAnimationFrame(render);
}

function startSleepVisual() {
    if (playerState.mode !== "sleeping" || standingUp || matchState.finished) return;
    playInterpolatedPose(sleepingMotion, sittingImage, startSleepBreathing);
}

function playRoarVisual() {
    playInterpolatedPose(roarMotion, normalImage, () => {
        showPlayerImage(roarImage);
        const generation = poseVisualGeneration;
        const startedAt = performance.now();
        const shake = (now) => {
            if (generation !== poseVisualGeneration || matchState.finished) return;
            const elapsed = now - startedAt;
            if (elapsed >= roarMotion.hold) {
                poseVisualFrame = null;
                const image = playerState.hasCarrot ? eatingImages.standing : normalImage;
                playInterpolatedPose(roarMotion, image, showCurrentState, true);
                return;
            }
            const x = Math.sin(elapsed * 2 * Math.PI / roarMotion.shakePeriod) * roarMotion.shakePx;
            player.style.transform = `translateX(${x}px)`;
            poseVisualFrame = requestAnimationFrame(shake);
        };
        poseVisualFrame = requestAnimationFrame(shake);
    });
}

function playPoseVisual(frames, onComplete = () => {}) {
    cancelPoseVisual();
    const generation = poseVisualGeneration;
    playPlayerFrameSequence(frames,
        () => generation === poseVisualGeneration && !matchState.finished,
        timer => { poseVisualTimer = timer; },
        () => {},
        () => { poseVisualTimer = null; onComplete(); });
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
    if (previousHolder === "player" || holder === "player") cancelPoseVisual();
    carrotState.holder = holder;
    if (previousHolder === "ground" && holder !== "ground" && openingState.active) finishOpening();
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
        refundPlayerDodge();
        playDodgeSuccessSound();
        setRoarGauge(roarGauge + dodgeRoarGain);
        return false;
    }
    updateEatingProgress();
    if (matchState.finished) return false;
    eatingVisualBlocked = true;
    stopEatingVisual();
    dodgeCausedFatigue = false;
    matchScore.hitsTaken += 1;
    if (poseVisualTimer !== null || poseVisualFrame !== null) {
        cancelPoseVisual();
        if (standingUp) showPlayerImage(playerState.hasCarrot ? eatingImages.standing : normalImage);
        else showCurrentState();
    }
    if (dodgePhase !== null) {
        clearTimeout(dodgeVisualTimer);
        dodgeVisualTimer = null;
        dodgeVisualGeneration += 1;
        clearMotionVisual();
        showCurrentState();
    }
    if (pickupInProgress) cancelPickup();
    recordSleepHit();
    const carrotDropHits = playerState.mode === "sittingEating" && !standingUp ? 2 : 3;
    changeStamina(-hitStaminaCost);
    if (playerState.hasCarrot && ++playerState.carrotHitCount >= carrotDropHits) dropCarrot("player", "punch");
    clearTimeout(playerHitEffectTimer);
    player.classList.remove("is-hit");
    carrot.classList.remove("is-hit");
    playerHitMark.classList.remove("is-visible");
    void player.offsetWidth;
    player.classList.add("is-hit");
    if (carrotState.holder === "player") carrot.classList.add("is-hit");
    playerHitMark.classList.add("is-visible");
    playerHitEffectTimer = setTimeout(() => {
        updateEatingProgress();
        player.classList.remove("is-hit");
        carrot.classList.remove("is-hit");
        playerHitMark.classList.remove("is-visible");
        playerHitEffectTimer = null;
        eatingVisualBlocked = false;
        if (poseVisualFrame === null && poseVisualTimer === null) startSleepBreathing();
        syncEatingVisual();
    }, 280);
    recordOpeningHit("cpu");
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
    if (!playerState.hasCarrot && stamina <= 0) return;
    updateEatingProgress();
    if (matchState.finished) return;
    playerState.mode = playerState.hasCarrot ? "sittingEating" : "sleeping";
    playerState.sleepHitCount = 0;
    updateCarrotDisplay();
    playInterpolatedPose(sittingMotion, playerState.hasCarrot ? eatingImages.standing : normalImage,
        playerState.hasCarrot ? showCurrentState : startSleepVisual);
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
        syncEatingVisual();
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
    playPoseVisual(standingFrames);
    standUpTimer = setTimeout(() => {
        if (generation !== standUpGeneration) return;
        cancelPoseVisual();
        updateEatingProgress();
        if (matchState.finished) return;
        updateStaminaRecovery();
        standingUp = false;
        standUpTimer = null;
        playerState.mode = playerState.hasCarrot ? "eating" : "normal";
        playerState.sleepHitCount = 0;
        showCurrentState();
        actionInProgress = false;
        syncEatingVisual();
    }, standUpDuration);
}

function cancelStandUp() {
    cancelPoseVisual();
    clearTimeout(standUpTimer);
    standUpGeneration += 1;
    standUpTimer = null;
    standingUp = false;
    actionInProgress = false;
}

function startDodge(direction) {
    if (matchState.finished || struggleState.active || actionInProgress || fatigued || stamina < dodgeStaminaCost || playerRoarStunned || playerCounterStunned || !dodgeMotions[direction]) return;

    updateEatingProgress();
    if (matchState.finished) return;
    cancelPoseVisual();
    updateStaminaRecovery();
    actionInProgress = true;
    dodgePhase = "start";
    updateCarrotDisplay();
    dodgeDirection = direction;
    dodgeStartedAt = performance.now();
    dodgeRefunded = false;
    changeStamina(-dodgeStaminaCost);
    dodgeCausedFatigue = fatigued && stamina === 0;
    const generation = ++dodgeGeneration;
    const visualGeneration = ++dodgeVisualGeneration;
    const motion = dodgeMotions[direction];
    const isVisualCurrent = () => generation === dodgeGeneration && visualGeneration === dodgeVisualGeneration && !matchState.finished;
    animateMotionVisual(motion, false, generation, isVisualCurrent);
    dodgeVisualTimer = setTimeout(() => {
        if (!isVisualCurrent()) return;
        clearMotionVisual();
        showPlayerImage(dodgeImages[direction], true, false, motion.endPosition);
        dodgeVisualTimer = setTimeout(() => {
            if (!isVisualCurrent()) return;
            animateMotionVisual(motion, true, generation, isVisualCurrent);
            dodgeVisualTimer = setTimeout(() => {
                if (!isVisualCurrent()) return;
                clearMotionVisual();
                dodgeVisualTimer = null;
                showCurrentState();
            }, motion.recovery);
        }, motion.contact);
    }, motion.windup);
    dodgeTimer = setTimeout(() => {
        if (generation !== dodgeGeneration) return;
        dodgePhase = "pose";
        dodgeTimer = setTimeout(() => {
            if (generation !== dodgeGeneration) return;
            dodgePhase = "recovery";
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
                syncEatingVisual();
            }, dodgeDurations.recovery);
        }, dodgeDurations.pose);
    }, dodgeDurations.start);
}

function cancelDodge() {
    clearTimeout(dodgeTimer);
    clearTimeout(dodgeVisualTimer);
    dodgeVisualTimer = null;
    dodgeVisualGeneration += 1;
    clearMotionVisual();
    dodgeGeneration += 1;
    dodgeTimer = null;
    dodgePhase = null;
    dodgeDirection = null;
    updateCarrotDisplay();
    actionInProgress = false;
}

function startCpuDodge(direction) {
    if (matchState.finished || struggleState.active || cpuState.fatigued || cpuState.stamina < dodgeStaminaCost ||
        (cpuState.mode !== "normal" && cpuState.mode !== "eating") || !cpuImages.dodge[direction]) return;
    updateCpuStaminaRecovery();
    stopCpuPose();
    cpuState.mode = "dodging";
    cpuState.dodgeDirection = direction;
    cpuState.dodgeStartedAt = performance.now();
    cpuState.dodgeRefunded = false;
    changeCpuStamina(-dodgeStaminaCost);
    cpuState.dodgeCausedFatigue = cpuState.fatigued && cpuState.stamina === 0;
    const generation = ++cpuState.dodgeGeneration;
    const motion = makeCpuMotion("dodge", direction, dodgeDurations.start, dodgeDurations.recovery);
    motion.windupHold = dodgeTiming.hold;
    const isVisualCurrent = () => generation === cpuState.dodgeGeneration && !matchState.finished;
    animateMotionVisual(motion, false, generation, isVisualCurrent, cpuVisual);
    setTimeout(() => {
        if (generation !== cpuState.dodgeGeneration) return;
        clearMotionVisual(cpuVisual);
        cpu.src = cpuImages.dodge[direction];
        setTimeout(() => {
            if (generation !== cpuState.dodgeGeneration) return;
            showCpuCurrentState();
            animateMotionVisual(motion, true, generation, isVisualCurrent, cpuVisual);
            setTimeout(() => {
                if (generation !== cpuState.dodgeGeneration) return;
                clearMotionVisual(cpuVisual);
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

function refundCpuDodge() {
    if (cpuState.dodgeRefunded) return;
    cpuState.dodgeRefunded = true;
    if (cpuState.dodgeCausedFatigue && cpuState.fatigued) {
        clearTimeout(cpuState.fatigueTimer);
        cpuState.fatigueTimer = null;
        cpuState.fatigued = false;
        cpuState.lastStaminaUpdate = performance.now();
    }
    cpuState.dodgeCausedFatigue = false;
    setCpuStamina(cpuState.stamina + dodgeStaminaCost, false);
}

function refundPlayerDodge() {
    if (dodgeRefunded) return;
    dodgeRefunded = true;
    if (dodgeCausedFatigue && fatigued) {
        clearTimeout(fatigueTimer);
        fatigueTimer = null;
        fatigued = false;
        lastStaminaUpdate = performance.now();
    }
    dodgeCausedFatigue = false;
    setStamina(stamina + dodgeStaminaCost, false);
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
        (button !== 0 && button !== 2)) return;
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
    clearTwoPlayerInput();
    pressedPunchButtons.clear();
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
    struggleTwoPlayerFeedback.textContent = "";
    struggleTwoPlayerFeedback.className = "struggle-feedback";
    struggleTwoPlayerFeedback.hidden = gameMode !== "2p";
    struggleInstruction.textContent = gameMode === "2p" ? "1P：ホイール上・下　2P：J / K を交互に！" : "ホイール上・下 または J / K を交互に！";
    struggleOpponentLabel.textContent = gameMode === "2p" ? "2P" : "CPU";
    gameScreen.classList.add("is-struggling");
    struggleUi.hidden = false;
    updateStruggleDisplay();
    startStruggleMusic();
    struggleState.displayTimer = setInterval(updateStruggleDisplay, 50);
    struggleState.finishTimer = setTimeout(() => finishStruggle(generation), struggleDuration);
    if (gameMode === "cpu") scheduleStruggleCpuInput(generation);
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
    clearTwoPlayerInput();
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

function stopCpuPose() {
    if (cpuPose.frame !== null) cancelAnimationFrame(cpuPose.frame);
    cpuPose.frame = null;
    cpuPose.generation += 1;
    cpuPose.kind = null;
    cpu.style.transform = "";
    cpu.style.transformOrigin = "";
}

function runCpuPose(kind, draw) {
    stopCpuPose();
    cpuPose.kind = kind;
    const generation = cpuPose.generation;
    const started = performance.now();
    const render = (now) => {
        if (generation !== cpuPose.generation || matchState.finished) return;
        if (draw(now - started)) cpuPose.frame = requestAnimationFrame(render);
        else { cpuPose.frame = null; cpuPose.kind = null; }
    };
    cpuPose.frame = requestAnimationFrame(render);
}

function applyCpuPoseTransform(element, motion, adjustment, progress) {
    element.style.transformOrigin = `${adjustment.originX}% ${adjustment.originY}%`;
    element.style.transform = `translateY(${motion.moveDown * progress}cqh) rotate(${motion.rotation * adjustment.direction * progress}deg) scaleY(${1 + (motion.scaleY - 1) * progress})`;
}

function playCpuTransition(kind, initial, target, motion, onComplete = () => {}, reverse = false) {
    cpu.src = initial;
    const adjustment = cpuPoseAdjustments[stageIndex];
    runCpuPose(kind, (elapsed) => {
        const t = Math.min(1, elapsed / motion.duration);
        const smooth = t * t * (3 - 2 * t);
        const p = reverse ? 1 - smooth : smooth;
        applyCpuPoseTransform(cpu, motion, adjustment, p);
        if (t < 1) return true;
        cpu.style.transform = "";
        cpu.style.transformOrigin = "";
        cpu.src = target;
        queueMicrotask(() => { if (cpuPose.generation === generation && cpuPose.kind === null && !matchState.finished) onComplete(); });
        return false;
    });
    const generation = cpuPose.generation;
}

function startCpuLoop(kind) {
    if (cpuPose.kind === kind || cpuHitEffectTimer !== null) return;
    runCpuPose(kind, (elapsed) => {
        if (kind === "sleep") {
            if (cpuState.mode !== "sleeping") { stopCpuPose(); return false; }
            const p = (1 - Math.cos(elapsed * 2 * Math.PI / sleepingMotion.breathPeriod)) / 2;
            const adjustment = cpuPoseAdjustments[stageIndex];
            cpu.style.transformOrigin = `${adjustment.originX}% ${adjustment.originY}%`;
            cpu.style.transform = `translateY(${-sleepingMotion.breathMoveY * p}px) rotate(${sleepingMotion.breathRotation * adjustment.direction * p}deg) scaleY(${1 + sleepingMotion.breathScaleY * p})`;
        }
        return true;
    });
}

function startCpuSitVisual() {
    const mode = cpuState.mode;
    const initial = mode === "sittingEating" ? cpuImages.eat.standing : cpuNormalImage;
    playCpuTransition("sit", initial, cpuImages.sit, sittingMotion, () => {
        if (cpuState.mode !== mode || cpuHitEffectTimer !== null) return;
        if (mode === "sleeping") playCpuTransition("sleep-transition", cpuImages.sit, cpuImages.sleep, sleepingMotion, () => startCpuLoop("sleep"));
        else showCpuCurrentState();
    });
}

function playCpuRoarVisual() {
    playCpuTransition("roar-rise", cpuNormalImage, cpuImages.roar, roarMotion, () => {
        runCpuPose("roar-hold", (elapsed) => {
            if (elapsed >= roarMotion.hold) {
                queueMicrotask(() => { if (roarState.phase === "effect" && roarState.attacker === "cpu") playCpuTransition("roar-return", cpuNormalImage, cpuNormalImage, roarMotion, () => {}, true); });
                return false;
            }
            cpu.style.transform = `translateX(${Math.sin(elapsed * 2 * Math.PI / roarMotion.shakePeriod) * roarMotion.shakePx}px)`;
            return true;
        });
    });
}

function showCpuCurrentState() {
    if (cpuPose.kind && (cpuState.mode === "sleeping" || cpuState.mode === "sittingEating" || cpuState.mode === "eating") && cpuHitEffectTimer === null) { updateCarrotDisplay(); return; }
    cpu.src = cpuState.mode === "sleeping" ? cpuImages.sleep :
        cpuState.mode === "sittingEating" ? cpuImages.eat.sitting :
        cpuState.mode === "eating" ? cpuImages.eat.standing : cpuNormalImage;
    updateCarrotDisplay();
    if (!matchState.finished && cpuHitEffectTimer === null && !cpuState.fatigued && !cpuState.roarStunned && !cpuState.counterStunned) {
        if (cpuState.mode === "sleeping") startCpuLoop("sleep");
    }
}

// コンソールから呼ぶ表示専用プレビュー。ゲーム状態やAIには触れない。
window.debugStopCpuMotion = () => {
    if (window.debugCpuMotionFrame != null) cancelAnimationFrame(window.debugCpuMotionFrame);
    window.debugCpuMotionFrame = null;
    document.getElementById("debug-cpu-motion")?.remove();
};
window.debugCpuMotion = (character, action) => {
    const index = Number(character) - 1;
    const assets = [
        { folder: "1_Normal", stand: "Stand_enemy.png", sit: "Sit_1.png", sleep: "Sleep1_enemy.png", pickup: "Pick up_1.png", roar: "Roar_1.png", eat: "Eat_1.png" },
        { folder: "2_Army", stand: "Stand_enemy2.png", sit: "Sit_enemy2.png", sleep: "Sleep_enemy2.png", pickup: "Pick up_enemy2.png", roar: "Roar_enemy2.png", eat: "Eat_1_enemy2.png" },
        { folder: "3_Champion", stand: "Stand_enemy3.png", sit: "Sit_enemy3.png", sleep: "Sleep_enemy3.png", pickup: "Pick up_enemy3.png", roar: "Roar_enemy3.png", eat: "Eat_1_enemy3.png" },
    ][index];
    if (!assets || !["sit", "pickup", "roar", "sleep", "eat"].includes(action)) throw new Error("debugCpuMotion(1〜3, 'sit'|'pickup'|'roar'|'sleep'|'eat')");
    window.debugStopCpuMotion();
    const overlay = document.createElement("div");
    overlay.id = "debug-cpu-motion";
    Object.assign(overlay.style, { position: "absolute", inset: "0", zIndex: "80", background: "rgba(0,0,0,.65)", pointerEvents: "none" });
    const img = document.createElement("img");
    Object.assign(img.style, { position: "absolute", inset: "0", width: "100%", height: "100%" });
    overlay.appendChild(img);
    gameScreen.appendChild(overlay);
    const file = (folder, name) => `assets/characters/cpu/${assets.folder}/${folder}/${name}`;
    const paths = { stand: file("stand", assets.stand), sit: file("sit", assets.sit), pickup: file("pick up", assets.pickup), roar: file("roar", assets.roar), sleep: file("sleep", assets.sleep), eat: file("eat", assets.eat) };
    const started = performance.now();
    const render = (now) => {
        const elapsed = now - started;
        const progress = (t) => { const n = Math.max(0, Math.min(1, t)); return n * n * (3 - 2 * n); };
        let image = paths.stand;
        img.style.transform = "";
        if (action === "sit" || action === "pickup") {
            const motion = action === "sit" ? sittingMotion : pickupMotion;
            if (elapsed < motion.duration) applyCpuPoseTransform(img, motion, cpuPoseAdjustments[index], progress(elapsed / motion.duration));
            else image = paths[action];
        } else if (action === "sleep") {
            if (elapsed < sittingMotion.duration) applyCpuPoseTransform(img, sittingMotion, cpuPoseAdjustments[index], progress(elapsed / sittingMotion.duration));
            else if (elapsed < sittingMotion.duration + sleepingMotion.duration) { image = paths.sit; applyCpuPoseTransform(img, sleepingMotion, cpuPoseAdjustments[index], progress((elapsed - sittingMotion.duration) / sleepingMotion.duration)); }
            else { image = paths.sleep; const p = (1 - Math.cos((elapsed - 600) * 2 * Math.PI / sleepingMotion.breathPeriod)) / 2; img.style.transformOrigin = `${cpuPoseAdjustments[index].originX}% ${cpuPoseAdjustments[index].originY}%`; img.style.transform = `translateY(${-sleepingMotion.breathMoveY * p}px) rotate(${sleepingMotion.breathRotation * cpuPoseAdjustments[index].direction * p}deg) scaleY(${1 + sleepingMotion.breathScaleY * p})`; }
        } else if (action === "roar") {
            const cycle = elapsed % roarDuration;
            if (cycle < roarMotion.duration) applyCpuPoseTransform(img, roarMotion, cpuPoseAdjustments[index], progress(cycle / roarMotion.duration));
            else if (cycle < roarMotion.duration + roarMotion.hold) { image = paths.roar; img.style.transform = `translateX(${Math.sin((cycle - roarMotion.duration) * 2 * Math.PI / roarMotion.shakePeriod) * roarMotion.shakePx}px)`; }
            else applyCpuPoseTransform(img, roarMotion, cpuPoseAdjustments[index], 1 - progress((cycle - roarMotion.duration - roarMotion.hold) / roarMotion.duration));
        } else { image = paths.eat; }
        if (img.getAttribute("src") !== image) img.src = image;
        window.debugCpuMotionFrame = requestAnimationFrame(render);
    };
    window.debugCpuMotionFrame = requestAnimationFrame(render);
    return "プレビュー終了: debugStopCpuMotion()";
};

function setCpuStamina(value, triggerFatigue = true) {
    const previous = cpuState.stamina;
    cpuState.stamina = Math.max(0, Math.min(maxStamina, value));
    if (previous > 0 && cpuState.stamina === 0) playStaminaEffect("cpu");
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
    stopCpuPose();
    releaseOpeningClaim("cpu");
    clearTimeout(cpuState.pickupTimer);
    cpuState.pickupGeneration += 1;
    cpuState.pickupTimer = null;
    cpuState.mode = "normal";
    cpuState.nextPickupAt = performance.now() + cpuRandomBetween(cpuAi.pickupDelayMin, cpuAi.pickupDelayMax);
    showCpuCurrentState();
}

function tryStartCpuPickup() {
    if (matchState.finished || struggleState.active || roarState.phase || carrotState.holder !== "ground" || cpuState.mode !== "normal" ||
        (openingState.active && openingState.claimant !== "cpu") ||
        cpuState.fatigued || performance.now() < cpuState.nextPickupAt ||
        performance.now() < carrotState.repickupBlockedUntil.cpu) return;
    updateCpuStaminaRecovery();
    if (pickupInProgress) {
        cpuState.mode = "picking";
        startStruggle();
        return;
    }
    cpuState.mode = "picking";
    playCpuTransition("pickup", cpuNormalImage, cpuImages.pickup, pickupMotion);
    const generation = ++cpuState.pickupGeneration;
    cpuState.pickupTimer = setTimeout(() => {
        if (generation !== cpuState.pickupGeneration) return;
        cpuState.pickupTimer = null;
        stopCpuPose();
        cpuState.mode = "normal";
        if (carrotState.holder === "ground" && !cpuState.fatigued) setCarrotHolder("cpu");
        releaseOpeningClaim("cpu");
        showCpuCurrentState();
        cpuState.nextPickupAt = performance.now() + cpuRandomBetween(cpuAi.pickupDelayMin, cpuAi.pickupDelayMax);
    }, pickupDuration);
}

function startCpuStandUp() {
    if (matchState.finished || (cpuState.mode !== "sleeping" && cpuState.mode !== "sittingEating")) return;
    updateEatingProgress();
    if (matchState.finished) return;
    updateCpuStaminaRecovery();
    stopCpuPose();
    cpuState.mode = "standingUp";
    playCpuTransition("stand-up", cpuNormalImage, cpuNormalImage, { ...sittingMotion, duration: standUpDuration }, () => {}, true);
    const generation = ++cpuState.standUpGeneration;
    setTimeout(() => {
        if (generation !== cpuState.standUpGeneration) return;
        stopCpuPose();
        cpuState.mode = cpuState.fatigued ? "fatigued" :
            carrotState.holder === "cpu" ? "eating" : "normal";
        cpuState.sleepHitCount = 0;
        showCpuCurrentState();
    }, standUpDuration);
}

function startCpuPunch(direction) {
    if (matchState.finished || struggleState.active || cpuState.mode !== "normal" || cpuState.fatigued || cpuState.stamina < punchStaminaCost ||
        carrotState.holder === "cpu") return;
    updateCpuStaminaRecovery();
    stopCpuPose();
    cpuState.mode = "punching";
    changeCpuStamina(-punchStaminaCost);
    const generation = ++cpuState.punchGeneration;
    const timing = punchTimings[direction];
    const motion = makeCpuMotion("punch", direction, timing.windup, timing.recovery);
    motion.punchVisual = { image: cpuImages.punch[direction], direction: direction === "left" ? 1 : -1, heads: punchVisualSettings.cpuHead[stageIndex], side: direction };
    motion.windupHold = timing.hold;
    const isVisualCurrent = () => generation === cpuState.punchGeneration && !matchState.finished;
    cpu.src = cpuNormalImage;
    animateMotionVisual(motion, false, generation, isVisualCurrent, cpuVisual);
    setTimeout(() => {
        if (generation !== cpuState.punchGeneration) return;
        clearMotionVisual(cpuVisual);
        cpu.src = cpuImages.punch[direction];
        applyPunchTransform(cpu, motion.punchVisual, 1, true);
        cpuVisual.punchElement = cpu;
        resolveCpuPunchHit(generation, direction);
        setTimeout(() => {
            if (generation !== cpuState.punchGeneration) return;
            cpu.style.transform = "";
            cpu.style.transformOrigin = "";
            cpu.src = cpuNormalImage;
            animateMotionVisual(motion, true, generation, isVisualCurrent, cpuVisual);
            setTimeout(() => {
                if (generation !== cpuState.punchGeneration) return;
                clearMotionVisual(cpuVisual);
                cpuState.mode = cpuState.fatigued ? "fatigued" : "normal";
                showCpuCurrentState();
            }, timing.recovery);
        }, timing.contact);
    }, timing.windup);
}

function resolveCpuPunchHit(punchId, direction) {
    if (punchId !== cpuState.punchGeneration || cpuState.lastResolvedAttack === punchId) return false;
    cpuState.lastResolvedAttack = punchId;
    return receivePlayerPunchHit(direction);
}

function maybeCpuDodge(attackDirection, punchId) {
    if (matchState.finished || gameMode !== "cpu") return;
    if (Math.random() >= cpuAi.dodgeChance) return;
    const warningAdjustment = Math.max(0, punchTimings[attackDirection].windup - (dodgeDurations.start + dodgeDurations.pose));
    setTimeout(() => {
        if (punchId === punchGeneration && punchPhase === "windup")
            startCpuDodge(dodgeDirectionForAttack[attackDirection]);
    }, warningAdjustment + cpuAi.dodgeReaction);
}

function cpuBrainTick() {
    if (matchState.finished || struggleState.active) return;
    updateCpuStaminaRecovery();
    if (carrotState.holder === "ground") tryStartCpuPickup();
    if (gameMode === "2p") return;
    if (!roarState.phase && !cpuState.roarStunned && !cpuState.counterStunned &&
        cpuState.roarGauge >= 100 && performance.now() >= cpuState.nextRoarDecisionAt) {
        cpuState.nextRoarDecisionAt = performance.now() +
            cpuRandomBetween(cpuAi.decisionMin, cpuAi.decisionMax);
        if (Math.random() < cpuAi.roarChance && beginRoar("cpu")) return;
    }
    if (cpuState.mode === "sleeping") {
        if (!cpuState.fatigued && (cpuState.stamina >= cpuAi.wakeStamina ||
            (carrotState.holder === "ground" && !openingState.active))) startCpuStandUp();
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
            startCpuSitVisual();
        }
    } else if (carrotState.holder === "player" || (carrotState.holder === "ground" && openingState.active)) {
        if (cpuState.stamina <= cpuAi.sleepThreshold) {
            cpuState.mode = "sleeping";
            cpuState.sleepHitCount = 0;
            startCpuSitVisual();
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
    clearMotionVisual();
    player.style.transform = "";
    player.style.transformOrigin = "";
    punchGeneration += 1;
    punchTimer = null;
    punchPhase = null;
    updateCarrotDisplay();
    actionInProgress = false;
}

function cancelPickup() {
    if (!pickupInProgress) return;
    releaseOpeningClaim("player");
    clearTimeout(pickupTimer);
    cancelPoseVisual();
    pickupGeneration += 1;
    pickupTimer = null;
    pickupInProgress = false;
    actionInProgress = false;
    showCurrentState();
}

function tryStartPickup() {
    if (matchState.finished || struggleState.active || carrotState.holder !== "ground" || playerState.mode !== "normal" || fatigued ||
        (openingState.active && openingState.claimant !== "player") ||
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
    playInterpolatedPose(pickupMotion, normalImage, () => showPlayerImage(pickupImage));
    pickupTimer = setTimeout(() => {
        if (generation !== pickupGeneration) return;
        cancelPoseVisual();
        pickupGeneration += 1;
        pickupTimer = null;
        pickupInProgress = false;
        actionInProgress = false;
        if (carrotState.holder === "ground" && !fatigued) setCarrotHolder("player");
        releaseOpeningClaim("player");
        showCurrentState();
    }, pickupDuration);
}

// 入力イベントと既存アクションの終了処理が先に走るよう、取得は次の更新で判定する。
setInterval(tryStartPickup, 100);

// 各フレームを即時に差し替える共通処理。世代判定は呼び出し側から渡す。
function playPlayerFrameSequence(frames, isCurrent, setTimer, onFrame, onComplete) {
    let index = 0;
    const showFrame = () => {
        if (!isCurrent()) return;
        const frame = frames[index];
        const image = standingUp && playerState.hasCarrot
            ? (frame.image === normalImage ? eatingImages.standing : eatingImages.sitting)
            : frame.image;
        showPlayerImage(image, frame.compactPose ?? false, frame.fullFrame ?? false);
        onFrame(index);
        if (!isCurrent()) return;
        setTimer(setTimeout(() => {
            if (!isCurrent()) return;
            index += 1;
            if (index < frames.length) showFrame();
            else onComplete();
        }, frame.duration));
    };
    showFrame();
}

// 透過部分を除いた範囲の中心を使い、共通フレーム内の両姿勢の間を移動する。
function imageCenter(src) {
    return new Promise((resolve) => {
        const image = new Image();
        image.onload = () => {
            try {
                const canvas = document.createElement("canvas");
                canvas.width = image.naturalWidth;
                canvas.height = image.naturalHeight;
                const context = canvas.getContext("2d", { willReadFrequently: true });
                context.drawImage(image, 0, 0);
                const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
                let minX = canvas.width, maxX = -1, minY = canvas.height, maxY = -1;
                for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
                    if (pixels[(y * canvas.width + x) * 4 + 3] > 32) {
                        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
                        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
                    }
                }
                resolve(maxX < 0 ? null : { x: (minX + maxX) / 2 / canvas.width * 100, y: (minY + maxY) / 2 / canvas.height * 100 });
            } catch (error) { resolve(null); }
        };
        image.onerror = () => resolve(null);
        image.src = src;
    });
}

function prepareCpuMotionImages(images) {
    const stand = imageCenter(images.stand);
    for (const action of ["punch", "dodge"]) for (const direction of ["left", "right"]) {
        const target = images[action][direction];
        Promise.all([stand, imageCenter(target)]).then(([from, to]) => {
            if (from && to) cpuMotionOffsets.set(images.stand + "|" + target, { x: to.x - from.x, y: to.y - from.y });
        });
    }
}

function makeCpuMotion(action, direction, windup, recovery) {
    const images = cpuImages.afterimage;
    const target = images[action][direction];
    return { windup, recovery, cpuMotion: cpuMotionOffsets.get(images.stand + "|" + target) || { x: 0, y: 0 }, layers: [
        { image: images.stand, copies: 3, opacity: 0.5, fade: "out", fadeStart: 0, fadeEnd: 0.375, offsetX: 0, offsetY: 0 },
        { image: target, copies: 3, opacity: 0.5, fade: "in", fadeStart: 0.25, fadeEnd: 1, offsetX: 0, offsetY: 0 },
    ] };
}

// 判定用のタイマーとは独立した、透過PNGの複製表示。
function clearMotionVisual(visual = playerVisual) {
    if (visual.frame !== null) cancelAnimationFrame(visual.frame);
    visual.frame = null;
    visual.generation += 1;
    for (const image of visual.layers) image.remove();
    visual.layers = [];
    if (visual.punchElement) {
        visual.punchElement.style.transform = "";
        visual.punchElement.style.transformOrigin = "";
        visual.punchElement = null;
    }
    visual.punchLeader = null;
    visual.punchSamples = [];
    visual.punchLastSample = null;
    gameScreen.classList.remove(visual.className);
}

function applyPunchTransform(element, config, progress, isCpu) {
    const settings = punchVisualSettings;
    const forward = isCpu ? settings.cpuForward : settings.playerForward;
    const forwardX = isCpu ? settings.cpuForwardX : settings.playerForwardX;
    const targetScale = isCpu ? settings.cpuScale : settings.playerScale;
    const x = forwardX * progress + config.direction * settings.arcWidth * Math.sin(Math.PI * progress);
    const scale = 1 + (targetScale - 1) * progress;
    // Head positions are measured from the common 1080px frame; compensate for
    // both transparent margins and scaling around the bottom of that frame.
    const head = config.heads[config.side] / 1080 * 100;
    const standHead = config.heads.stand / 1080 * 100;
    const y = standHead - head + forward * progress - (scale - 1) * (head - 100);
    element.style.transformOrigin = `${isCpu ? settings.cpuOriginX : settings.playerOriginX}% 100%`;
    element.style.transform = `translate(${x}cqw, ${y}cqh) scale(${scale})`;
}

function renderPunchVisual(config, progress, visual) {
    const settings = punchVisualSettings;
    const now = performance.now();
    if (!visual.punchLeader) {
        const image = document.createElement("img");
        image.className = visual === cpuVisual ? "motion-ghost cpu-motion-ghost" : "motion-ghost";
        image.src = config.punchVisual.image;
        image.alt = "";
        image.setAttribute("aria-hidden", "true");
        gameScreen.appendChild(image);
        visual.layers.push(image);
        visual.punchLeader = image;
        visual.punchSamples = [];
        visual.punchLastSample = now;
    }
    const leader = visual.punchLeader;
    leader.style.opacity = String(settings.opacity);
    applyPunchTransform(leader, config.punchVisual, progress, visual === cpuVisual);
    if (now - visual.punchLastSample >= settings.sampleInterval) {
        const image = leader.cloneNode();
        gameScreen.appendChild(image);
        visual.layers.push(image);
        visual.punchSamples.push({ image, time: now });
        visual.punchLastSample = now;
    }
    while (visual.punchSamples.length && (visual.punchSamples.length > settings.copies || now - visual.punchSamples[0].time >= settings.trailLifetime)) {
        const { image } = visual.punchSamples.shift();
        image.remove();
        visual.layers.splice(visual.layers.indexOf(image), 1);
    }
    for (const sample of visual.punchSamples) {
        sample.image.style.opacity = String(settings.opacity * (1 - (now - sample.time) / settings.trailLifetime));
    }
    gameScreen.classList.add(visual.className);
}

function renderMotionVisual(config, progress, visual = playerVisual) {
    progress = Math.max(0, Math.min(1, progress));
    if (config.punchVisual) { renderPunchVisual(config, progress, visual); return; }
    if (!visual.layers.length) {
        for (const layer of config.layers) {
            for (let copy = 0; copy < layer.copies; copy += 1) {
                const image = document.createElement("img");
                image.className = visual === cpuVisual ? "motion-ghost cpu-motion-ghost" : "motion-ghost";
                image.src = layer.image;
                image.alt = "";
                image.setAttribute("aria-hidden", "true");
                gameScreen.appendChild(image);
                visual.layers.push(image);
            }
        }
    }
    let index = 0;
    for (const layer of config.layers) {
        const start = layer.fadeStart ?? 0;
        const end = layer.fadeEnd ?? 1;
        const position = Math.max(0, Math.min(1, (progress - start) / (end - start)));
        const eased = position * position * (3 - 2 * position);
        const intensity = layer.fade === "in" ? eased : 1 - eased;
        for (let copy = 0; copy < layer.copies; copy += 1) {
            const image = visual.layers[index++];
            image.style.opacity = String(layer.opacity * intensity * (1 - copy / layer.copies));
            let x = layer.offsetX * copy * intensity;
            let y = layer.offsetY * copy * intensity;
            if (config.cpuMotion) {
                const delta = config.cpuMotion;
                const t = Math.max(0, Math.min(1, progress - copy / layer.copies * 0.2));
                x = delta.x * (layer.fade === "in" ? t - 1 : t);
                y = delta.y * (layer.fade === "in" ? t - 1 : t);
            }
            image.style.transform = `translate(${x}cqw, ${y}cqh)`;
        }
    }
    gameScreen.classList.add(visual.className);
}

function animateMotionVisual(config, reverse, generation, isCurrent = () => generation === punchGeneration, visual = playerVisual) {
    clearMotionVisual(visual);
    const hold = reverse ? 0 : (config.windupHold ?? 0);
    const duration = reverse ? config.recovery : config.windup - hold;
    const visualGeneration = visual.generation;
    const startedAt = performance.now();
    const renderFrame = (now) => {
        if (visualGeneration !== visual.generation || !isCurrent() || matchState.finished) return;
        const elapsed = now - startedAt;
        if (elapsed < hold) {
            visual.frame = requestAnimationFrame(renderFrame);
            return;
        }
        const fraction = Math.max(0, Math.min(1, (elapsed - hold) / duration));
        const progress = reverse ? 1 - fraction : fraction;
        renderMotionVisual(config, progress, visual);
        visual.frame = fraction < 1 ? requestAnimationFrame(renderFrame) : null;
    };
    if (hold === 0) renderMotionVisual(config, reverse ? 1 : 0, visual);
    visual.frame = requestAnimationFrame(renderFrame);
}

function startPunch(button) {
    if (matchState.finished || struggleState.active || actionInProgress || fatigued || playerRoarStunned || playerCounterStunned ||
        stamina < punchStaminaCost || playerState.hasCarrot) return;
    updateEatingProgress();
    if (matchState.finished) return;
    cancelPoseVisual();
    updateStaminaRecovery();
    actionInProgress = true;
    punchPhase = "windup";
    updateCarrotDisplay();
    changeStamina(-punchStaminaCost);
    const generation = ++punchGeneration;
    const attackDirection = button === 0 ? "left" : "right";
    maybeCpuDodge(attackDirection, generation);

    const motion = { ...(button === 2 ? rightPunchMotion : leftPunchMotion), punchVisual: { image: punchImages[button], direction: button === 0 ? -1 : 1, heads: punchVisualSettings.playerHead, side: button === 0 ? "left" : "right" } };
    animateMotionVisual(motion, false, generation);
    punchTimer = setTimeout(() => {
        if (generation !== punchGeneration || matchState.finished) return;
        clearMotionVisual();
        punchPhase = "contact";
        showPlayerImage(punchImages[button]);
        applyPunchTransform(player, motion.punchVisual, 1, false);
        playerVisual.punchElement = player;
        receiveCpuPunchHit(generation, attackDirection);
        if (generation !== punchGeneration || matchState.finished) return;
        punchTimer = setTimeout(() => {
            if (generation !== punchGeneration || matchState.finished) return;
            punchPhase = "recovery";
            animateMotionVisual(motion, true, generation);
            punchTimer = setTimeout(() => {
                if (generation !== punchGeneration || matchState.finished) return;
                clearMotionVisual();
                updateStaminaRecovery();
                punchPhase = null;
                punchTimer = null;
                showCurrentState();
                actionInProgress = false;
            }, motion.recovery);
        }, motion.contact);
    }, motion.windup);
}

function cancelCpuActionForRoar() {
    stopCpuPose();
    clearMotionVisual(cpuVisual);
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
        cancelPoseVisual();
        matchScore.hitsTaken += 1;
        if (punchPhase) cancelPunch();
        if (dodgePhase) cancelDodge();
        if (pickupInProgress) cancelPickup();
        if (standingUp) cancelStandUp();
        if (playerState.hasCarrot) dropCarrot("player", "roar");
        playerState.mode = "normal";
        playerState.sleepHitCount = 0;
        playerRoarStunned = true;
        actionInProgress = true;
        setStamina(Math.ceil(stamina / 2), false);
        showCurrentState();
        player.classList.add("is-roar-hit");
    } else {
        cancelCpuActionForRoar();
        if (carrotState.holder === "cpu") dropCarrot("cpu", "roar");
        cpuState.mode = "roarStunned";
        cpuState.roarStunned = true;
        setCpuStamina(Math.ceil(cpuState.stamina / 2), false);
        showCpuCurrentState();
        cpu.classList.add("is-roar-hit");
    }
}

function releaseRoarTarget(target) {
    if (target === "player") {
        playerRoarStunned = false;
        actionInProgress = false;
        playerState.mode = playerState.hasCarrot ? "eating" : "normal";
        lastStaminaUpdate = performance.now();
        showCurrentState();
    } else {
        cpuState.roarStunned = false;
        cpuState.mode = cpuState.fatigued ? "fatigued" : carrotState.holder === "cpu" ? "eating" : "normal";
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
        cancelPoseVisual();
        roarInProgress = false;
        actionInProgress = false;
        playerState.mode = playerState.hasCarrot ? "eating" : "normal";
        showCurrentState();
    } else {
        stopCpuPose();
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
    if (attacker === "player") playRoarVisual();
    else playCpuRoarVisual();
    roarState.effectTimer = setTimeout(() => finishRoarEffect(generation, target), roarDuration);
}

function beginRoar(attacker) {
    if (matchState.finished || struggleState.active || roarState.phase ||
        (attacker === "player" && (playerRoarStunned || playerCounterStunned))) return false;
    if (attacker === "player") {
        if (roarGauge < 100 || roarInProgress) return false;
        updateEatingProgress();
        if (matchState.finished) return false;
        cancelPoseVisual();
        updateStaminaRecovery();
        if (punchPhase) cancelPunch();
        if (dodgePhase) cancelDodge();
        if (standingUp) cancelStandUp();
        if (pickupInProgress) cancelPickup();
        clearPendingRoar();
        playerState.mode = playerState.hasCarrot ? "eating" : "normal";
        playerState.sleepHitCount = 0;
        showCurrentState();
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
    if (gameMode === "cpu" && attacker === "player" && (cpuState.mode === "normal" || cpuState.mode === "eating") &&
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
    pendingRoarTimer = setTimeout(clearPendingRoar, roarInputWindow);
}

function clearTwoPlayerInput() {
    twoPlayerKeys.clear();
    clearTimeout(twoPlayerRoarTimer);
    twoPlayerRoarTimer = null;
}

function startTwoPlayerSit() {
    if (cancelRoarWarning("cpu")) return;
    if (cpuState.fatigued || cpuState.roarStunned || cpuState.counterStunned) return;
    if (cpuState.mode === "sleeping" || cpuState.mode === "sittingEating") {
        startCpuStandUp();
    } else if ((cpuState.mode === "normal" || cpuState.mode === "eating") && cpuState.stamina > 0) {
        updateEatingProgress();
        if (matchState.finished) return;
        updateCpuStaminaRecovery();
        cpuState.mode = carrotState.holder === "cpu" ? "sittingEating" : "sleeping";
        cpuState.sleepHitCount = 0;
        startCpuSitVisual();
    }
}

window.addEventListener("keydown", (event) => {
    if (matchState.finished || !["KeyD", "KeyF", "KeyJ", "KeyK", "Space"].includes(event.code)) return;
    if (gameMode !== "2p") {
        if (struggleState.active && (event.code === "KeyJ" || event.code === "KeyK")) {
            event.preventDefault();
            if (!event.repeat) recordStrugglePlayerInput(event.code === "KeyJ" ? 0 : 2);
        }
        return;
    }
    event.preventDefault();
    if (event.repeat || twoPlayerKeys.has(event.code)) return;
    twoPlayerKeys.add(event.code);
    if (struggleState.active) {
        if ((event.code === "KeyJ" || event.code === "KeyK") && performance.now() < struggleState.endsAt) {
            const button = event.code === "KeyJ" ? 0 : 2;
            const good = struggleState.lastCpuButton === null || struggleState.lastCpuButton !== button;
            if (good) struggleState.cpuGood += 1;
            struggleState.lastCpuButton = button;
            struggleTwoPlayerFeedback.textContent = `2P ${good ? "GOOD" : "MISS"}`;
            struggleTwoPlayerFeedback.className = `struggle-feedback ${good ? "good" : "miss"}`;
            startStruggleMusic();
            updateStruggleDisplay();
        }
        return;
    }
    if (event.code === "Space") { startTwoPlayerSit(); return; }
    if (event.code === "KeyJ" || event.code === "KeyK") {
        if (cpuState.mode === "sleeping" || cpuState.mode === "sittingEating") startCpuStandUp();
        else startCpuDodge(event.code === "KeyJ" ? "left" : "right");
        return;
    }
    if (twoPlayerKeys.has("KeyD") && twoPlayerKeys.has("KeyF")) {
        // 両押しになった時点で振り出し中のパンチを中断し、長押し判定へ移る。
        if (cpuState.mode === "punching") {
            cpuState.punchGeneration += 1;
            clearMotionVisual(cpuVisual);
            cpuState.mode = cpuState.fatigued ? "fatigued" : "normal";
            showCpuCurrentState();
        }
        const round = matchState.generation;
        clearTimeout(twoPlayerRoarTimer);
        twoPlayerRoarTimer = setTimeout(() => {
            twoPlayerRoarTimer = null;
            if (round === matchState.generation && twoPlayerKeys.has("KeyD") && twoPlayerKeys.has("KeyF")) beginRoar("cpu");
        }, twoPlayerRoarHoldDuration);
    } else if (cpuState.mode === "sleeping" || cpuState.mode === "sittingEating") {
        startCpuStandUp();
    } else {
        startCpuPunch(event.code === "KeyF" ? "left" : "right");
    }
});

window.addEventListener("keyup", (event) => {
    twoPlayerKeys.delete(event.code);
    if (event.code === "KeyD" || event.code === "KeyF") {
        clearTimeout(twoPlayerRoarTimer);
        twoPlayerRoarTimer = null;
    }
});

gameScreen.addEventListener("mousedown", (event) => {
    if (matchState.finished) return;
    if (struggleState.active) {
        if (event.button === 2) event.preventDefault();
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
        performance.now() - pendingRoar.startedAt <= roarInputWindow) {
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
    pressedPunchButtons.delete(event.button);
});

window.addEventListener("blur", () => {
    pressedPunchButtons.clear();
    clearPendingRoar();
    clearTwoPlayerInput();
});

gameScreen.addEventListener("auxclick", (event) => {
    if (event.button === 1) event.preventDefault();
});

gameScreen.addEventListener("wheel", (event) => {
    event.preventDefault();
    if (matchState.finished || event.deltaY === 0) return;
    if (struggleState.active) {
        recordStrugglePlayerInput(event.deltaY < 0 ? 0 : 2);
        return;
    }
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

startButton.addEventListener("click", (event) => {
    event.stopPropagation();
    gameMode = "cpu";
    restartStage1();
});
twoPlayerButton.addEventListener("click", () => {
    titleScreen.hidden = true;
    twoPlayerHelp.hidden = false;
    twoPlayerStart.focus();
});
twoPlayerBack.addEventListener("click", () => showTitle("CPU戦 3ステージ連戦"));
twoPlayerStart.addEventListener("click", () => {
    gameMode = "2p";
    twoPlayerHelp.hidden = true;
    startStage(0);
});
scoreContinue.addEventListener("click", () => {
    scoreScreen.hidden = true;
    if (stageIndex < stages.length - 1) {
        startStage(stageIndex + 1);
    } else if (runScore.eligible && runScore.stages.length === stages.length && runScore.stages.every(Boolean)) {
        const total = runScore.stages.reduce((sum, score) => sum + score.total, 0);
        totalScoreLabel.textContent = `総合スコア　${total.toLocaleString()}点`;
        recordName.value = "";
        recordError.textContent = "";
        entryScreen.hidden = false;
        recordName.focus();
    } else {
        showTitle("クリア！ 引き分けがあったためレコード登録はできません。");
    }
});
recordsButton.addEventListener("click", showRanking);
rankingBack.addEventListener("click", () => showTitle("CPU戦 3ステージ連戦"));
recordForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (entryScreen.hidden || !runScore.eligible || runScore.stages.length !== stages.length || !runScore.stages.every(Boolean)) return;
    const record = {
        name: Array.from(recordName.value.trim()).slice(0, 12).join("") || "PLAYER",
        total: runScore.stages.reduce((sum, score) => sum + score.total, 0),
        stages: runScore.stages.map(score => score.total),
        elapsedMs: runScore.stages.reduce((sum, score) => sum + score.elapsedMs, 0),
        registeredAt: new Date().toISOString(),
    };
    try {
        localStorage.setItem(rankingKey, JSON.stringify(sortRecords([...loadRecords(), record])));
    } catch (_) {
        recordError.textContent = "保存できませんでした。ブラウザの保存設定を確認してください。";
        return;
    }
    runScore.eligible = false;
    showRanking();
});
configureStage(0);
matchState.finished = true;
showCurrentState();
showCpuCurrentState();
showTitle("CPU戦 3ステージ連戦");

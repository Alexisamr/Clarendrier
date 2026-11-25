/**
 * ============================================================================
 * MOTEUR AUDIO PROCÉDURAL (WEB AUDIO API) — BAIN DE MINUIT AU CAP FERRET
 * - Vagues lointaines qui éclatent : impact très grave et très puissant,
 *   saturation chaude dans les basses et réverbération nocturne profonde
 * - Musique romantique évolutive : thème nocturne calme dès le retour vers
 *   Alexis, qui s'enrichit au fil du cœur et s'emballe dès qu'il est complet
 * ============================================================================
 */

import { closeAudioContextSafely } from '../utils/helpers.js';

// Gamme de Ré majeur / Si mineur (chaleureuse, rêveuse et romantique)
const STAR_CHIME_SCALE_HZ = [
    587.33, // D5
    659.25, // E5
    739.99, // F#5
    880.00, // A5
    987.77, // B5
    1174.66, // D6
    1318.51, // E6
    1479.98  // F#6
];

// Progression d'accords nocturne : Dmaj7 -> Bm9 -> Gmaj7 -> A6sus4
const CHORD_PROGRESSION = [
    {
        bass: 73.42, // D2
        pad: [146.83, 220.00, 277.18, 369.99], // D3, A3, C#4, F#4
        arpCalm: [293.66, 369.99, 440.00, 554.37, 587.33, 440.00, 369.99, 554.37],
        arpClimax: [293.66, 369.99, 440.00, 554.37, 587.33, 739.99, 880.00, 1174.66],
        melody: [739.99, 880.00, 1174.66, 987.77] // F#5, A5, D6, B5
    },
    {
        bass: 61.74, // B1
        pad: [123.47, 185.00, 220.00, 293.66], // B2, F#3, A3, D4
        arpCalm: [246.94, 293.66, 369.99, 440.00, 554.37, 440.00, 369.99, 293.66],
        arpClimax: [246.94, 293.66, 369.99, 440.00, 554.37, 587.33, 739.99, 987.77],
        melody: [880.00, 739.99, 659.25, 739.99] // A5, F#5, E5, F#5
    },
    {
        bass: 98.00, // G2
        pad: [196.00, 246.94, 293.66, 369.99], // G3, B3, D4, F#4
        arpCalm: [196.00, 293.66, 369.99, 493.88, 587.33, 493.88, 369.99, 293.66],
        arpClimax: [196.00, 293.66, 369.99, 493.88, 587.33, 739.99, 987.77, 1174.66],
        melody: [987.77, 1174.66, 1318.51, 1174.66] // B5, D6, E6, D6
    },
    {
        bass: 110.00, // A2
        pad: [164.81, 220.00, 277.18, 329.63], // E3, A3, C#4, E4
        arpCalm: [220.00, 277.18, 329.63, 440.00, 554.37, 440.00, 329.63, 277.18],
        arpClimax: [220.00, 277.18, 329.63, 440.00, 554.37, 659.25, 880.00, 1108.73],
        melody: [1108.73, 987.77, 880.00, 1174.66] // C#6, B5, A5, D6
    }
];

export function createMidnightAudioEngine() {
    let audioCtx = null;
    let masterBus = null;
    let musicBus = null;
    let echoInput = null;

    // Buffers réutilisables (zéro allocation lourde dans la boucle de jeu)
    let brownNoiseBuf = null;
    let pinkNoiseBuf = null;
    let waveSaturationCurve = null;

    // État de la musique romantique
    let musicRunning = false;
    let musicMode = 'idle'; // 'idle' | 'calm' | 'climax'
    let musicProgress = 0;  // 0..1 pendant le tracé du cœur
    let musicTimeoutId = null;
    let chordIndex = 0;
    let beatStep = 0;
    let disposed = false;

    function buildWaveSaturationCurve(drive = 2.4) {
        const samples = 2048;
        const curve = new Float32Array(samples);
        const norm = Math.tanh(drive);
        for (let i = 0; i < samples; i++) {
            const x = (i * 2) / (samples - 1) - 1;
            curve[i] = Math.tanh(x * drive) / norm;
        }
        return curve;
    }

    function buildNoiseBuffers(ac) {
        const sr = ac.sampleRate;

        // 1. Bruit rose 4.5s (corps riche de la déferlante audible même sur haut-parleur de téléphone)
        const pLen = Math.floor(sr * 4.5);
        pinkNoiseBuf = ac.createBuffer(1, pLen, sr);
        const pData = pinkNoiseBuf.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        let maxPink = 0.001;
        for (let i = 0; i < pLen; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            const val = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            b6 = white * 0.115926;
            pData[i] = val;
            const a = Math.abs(val);
            if (a > maxPink) maxPink = a;
        }
        const pinkNorm = 0.96 / maxPink;
        for (let i = 0; i < pLen; i++) {
            pData[i] *= pinkNorm;
        }

        // 2. Bruit brun très profond 4.5s (grondement massif des vagues & réverbération grave)
        const bLen = Math.floor(sr * 4.5);
        brownNoiseBuf = ac.createBuffer(1, bLen, sr);
        const bData = brownNoiseBuf.getChannelData(0);
        let last = 0;
        let maxAbs = 0.001;
        for (let i = 0; i < bLen; i++) {
            const white = Math.random() * 2 - 1;
            last = (last + 0.024 * white) / 1.024;
            bData[i] = last;
            const a = Math.abs(last);
            if (a > maxAbs) maxAbs = a;
        }
        // Normalisation pleine dynamique pour un gros impact dans les graves
        const norm = 0.98 / maxAbs;
        for (let i = 0; i < bLen; i++) {
            bData[i] *= norm;
        }

        waveSaturationCurve = buildWaveSaturationCurve(2.4);
    }

    function ensureAudio() {
        if (disposed) return null;
        try {
            if (!audioCtx) {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                if (!AudioContextClass) return null;
                audioCtx = new AudioContextClass();

                // Limiteur de sécurité transparent (-1.5dB) : laisse les vagues sonner très fort sans jamais écraser le volume
                const limiter = audioCtx.createDynamicsCompressor();
                limiter.threshold.setValueAtTime(-1.5, audioCtx.currentTime);
                limiter.knee.setValueAtTime(4, audioCtx.currentTime);
                limiter.ratio.setValueAtTime(16, audioCtx.currentTime);
                limiter.attack.setValueAtTime(0.002, audioCtx.currentTime);
                limiter.release.setValueAtTime(0.14, audioCtx.currentTime);

                masterBus = audioCtx.createGain();
                masterBus.gain.value = 1.0;
                masterBus.connect(limiter);
                limiter.connect(audioCtx.destination);

                // Bus dédié à la musique romantique (permet fondu doux et montée d'intensité)
                musicBus = audioCtx.createGain();
                musicBus.gain.value = 0.0001;
                musicBus.connect(masterBus);

                // Petit délai rêveur partagé pour la musique et les carillons stellaires
                echoInput = audioCtx.createGain();
                echoInput.gain.value = 0.34;
                const delay = audioCtx.createDelay(1.0);
                delay.delayTime.value = 0.36;
                const delayFilter = audioCtx.createBiquadFilter();
                delayFilter.type = 'lowpass';
                delayFilter.frequency.value = 2200;
                const delayFeedback = audioCtx.createGain();
                delayFeedback.gain.value = 0.36;

                echoInput.connect(delay);
                delay.connect(delayFilter);
                delayFilter.connect(delayFeedback);
                delayFeedback.connect(delay);
                delayFilter.connect(musicBus);

                buildNoiseBuffers(audioCtx);
            }

            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            return audioCtx;
        } catch {
            return null;
        }
    }

    /**
     * 1. VAGUES LOINTAINES QUI ÉCLATENT : TRÈS GRAVES, MASSIVES ET PUISSANTES
     *    - Double impact grave (sub 56Hz->20Hz + corps percutant 98Hz->40Hz audible sur téléphone et PC)
     *    - Mur d'eau en bruit brun + déferlante en bruit rose boostés aux graves (+12dB)
     *    - Saturation douce (tanh) qui densifie la puissance perçue et enrichit les basses sans écrêter
     *    - Échos caverneux profonds qui roulent longtemps dans la nuit
     */
    function triggerWaveBoom() {
        const ac = ensureAudio();
        if (!ac || !masterBus || !brownNoiseBuf || !pinkNoiseBuf) return;

        try {
            const now = ac.currentTime;

            // Chaîne de puissance dédiée à la vague : gain -> boost graves -> saturation chaude -> sortie forte
            const waveBus = ac.createGain();
            waveBus.gain.setValueAtTime(2.3, now);

            const bassShelf = ac.createBiquadFilter();
            bassShelf.type = 'lowshelf';
            bassShelf.frequency.setValueAtTime(115, now);
            bassShelf.gain.setValueAtTime(12, now);

            const shaper = ac.createWaveShaper();
            shaper.curve = waveSaturationCurve;
            shaper.oversample = '2x';

            const waveOut = ac.createGain();
            waveOut.gain.setValueAtTime(1.45, now);

            waveBus.connect(bassShelf);
            bassShelf.connect(shaper);
            shaper.connect(waveOut);
            waveOut.connect(masterBus);

            // Couche A : Sub-basse profonde (58Hz -> 20Hz) pour le poids viscéral
            const sub1 = ac.createOscillator();
            const sub1Gain = ac.createGain();
            sub1.type = 'sine';
            sub1.frequency.setValueAtTime(58, now);
            sub1.frequency.exponentialRampToValueAtTime(20, now + 2.5);

            sub1Gain.gain.setValueAtTime(0.001, now);
            sub1Gain.gain.linearRampToValueAtTime(1.25, now + 0.055);
            sub1Gain.gain.exponentialRampToValueAtTime(0.45, now + 0.85);
            sub1Gain.gain.exponentialRampToValueAtTime(0.001, now + 3.2);

            sub1.connect(sub1Gain);
            sub1Gain.connect(waveBus);
            sub1.start(now);
            sub1.stop(now + 3.3);

            // Couche B : Corps grave percutant (96Hz -> 38Hz, triangle filtrée — très audible sur téléphone & enceintes)
            const sub2 = ac.createOscillator();
            const sub2Filter = ac.createBiquadFilter();
            const sub2Gain = ac.createGain();
            sub2.type = 'triangle';
            sub2.frequency.setValueAtTime(96, now);
            sub2.frequency.exponentialRampToValueAtTime(38, now + 2.3);
            sub2Filter.type = 'lowpass';
            sub2Filter.frequency.setValueAtTime(185, now);
            sub2Filter.frequency.exponentialRampToValueAtTime(75, now + 2.4);

            sub2Gain.gain.setValueAtTime(0.001, now);
            sub2Gain.gain.linearRampToValueAtTime(1.15, now + 0.065);
            sub2Gain.gain.exponentialRampToValueAtTime(0.35, now + 0.9);
            sub2Gain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);

            sub2.connect(sub2Filter);
            sub2Filter.connect(sub2Gain);
            sub2Gain.connect(waveBus);
            sub2.start(now);
            sub2.stop(now + 3.1);

            // Couche C : Grondement massif de la déferlante (bruit brun plein volume)
            const slamNoise = ac.createBufferSource();
            slamNoise.buffer = brownNoiseBuf;

            const slamFilter = ac.createBiquadFilter();
            slamFilter.type = 'lowpass';
            slamFilter.frequency.setValueAtTime(310, now);
            slamFilter.frequency.exponentialRampToValueAtTime(58, now + 4.2);
            slamFilter.Q.setValueAtTime(1.6, now);

            const slamGain = ac.createGain();
            slamGain.gain.setValueAtTime(0.001, now);
            slamGain.gain.linearRampToValueAtTime(1.45, now + 0.09);
            slamGain.gain.exponentialRampToValueAtTime(0.58, now + 1.15);
            slamGain.gain.exponentialRampToValueAtTime(0.001, now + 4.35);

            slamNoise.connect(slamFilter);
            slamFilter.connect(slamGain);
            slamGain.connect(waveBus);
            slamNoise.start(now);
            slamNoise.stop(now + 4.45);

            // Couche D : Déferlante d'écume grave et puissante (bruit rose filtré bas-médiums pour un volume franc)
            const roarNoise = ac.createBufferSource();
            roarNoise.buffer = pinkNoiseBuf;

            const roarFilter = ac.createBiquadFilter();
            roarFilter.type = 'lowpass';
            roarFilter.frequency.setValueAtTime(640, now + 0.02);
            roarFilter.frequency.exponentialRampToValueAtTime(115, now + 3.6);
            roarFilter.Q.setValueAtTime(1.1, now);

            const roarGain = ac.createGain();
            roarGain.gain.setValueAtTime(0.001, now);
            roarGain.gain.linearRampToValueAtTime(0.92, now + 0.11);
            roarGain.gain.exponentialRampToValueAtTime(0.34, now + 1.1);
            roarGain.gain.exponentialRampToValueAtTime(0.001, now + 3.9);

            roarNoise.connect(roarFilter);
            roarFilter.connect(roarGain);
            roarGain.connect(waveBus);
            roarNoise.start(now);
            roarNoise.stop(now + 4.0);

            // Réverbération nocturne par 3 réflexions graves décalées qui prolongent le fracas
            const reverbDelays = [0.24, 0.56, 0.98];
            const reverbGains = [0.55, 0.36, 0.22];
            reverbDelays.forEach((dTime, idx) => {
                const tap = ac.createDelay(1.5);
                tap.delayTime.value = dTime;
                const tapFilter = ac.createBiquadFilter();
                tapFilter.type = 'lowpass';
                tapFilter.frequency.value = 185 - idx * 35;
                const tapGain = ac.createGain();
                tapGain.gain.value = reverbGains[idx];

                slamGain.connect(tap);
                tap.connect(tapFilter);
                tapFilter.connect(tapGain);
                tapGain.connect(waveBus);
            });
        } catch {
            // Ignore si bloqué
        }
    }

    /**
     * 3. CARILLON STELLAIRE HARMONIQUE (accordé sur la gamme de Ré majeur de la musique)
     */
    function playStarChime(stepIndex, isMilestone = false) {
        const ac = ensureAudio();
        if (!ac || !masterBus) return;

        try {
            const now = ac.currentTime;
            const freq = STAR_CHIME_SCALE_HZ[stepIndex % STAR_CHIME_SCALE_HZ.length];

            const osc = ac.createOscillator();
            const overtone = ac.createOscillator();
            const gain = ac.createGain();
            const overGain = ac.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);

            overtone.type = 'triangle';
            overtone.frequency.setValueAtTime(freq * 2, now);

            gain.gain.setValueAtTime(0.0008, now);
            gain.gain.linearRampToValueAtTime(isMilestone ? 0.15 : 0.11, now + 0.022);
            gain.gain.exponentialRampToValueAtTime(0.0008, now + (isMilestone ? 2.1 : 1.55));

            overGain.gain.setValueAtTime(0.0005, now);
            overGain.gain.linearRampToValueAtTime(isMilestone ? 0.036 : 0.02, now + 0.02);
            overGain.gain.exponentialRampToValueAtTime(0.0005, now + 0.75);

            osc.connect(gain);
            overtone.connect(overGain);
            gain.connect(masterBus);
            overGain.connect(masterBus);
            if (echoInput) {
                gain.connect(echoInput);
            }

            osc.start(now);
            overtone.start(now);
            osc.stop(now + 2.2);
            overtone.stop(now + 0.85);

            // Accord scintillant discret sur les étoiles-étapes (4e et 8e étoile)
            if (isMilestone) {
                const fifthFreq = freq * 1.498; // Quinte juste
                const osc2 = ac.createOscillator();
                const g2 = ac.createGain();
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(fifthFreq, now + 0.08);
                g2.gain.setValueAtTime(0.0008, now + 0.08);
                g2.gain.linearRampToValueAtTime(0.085, now + 0.12);
                g2.gain.exponentialRampToValueAtTime(0.0008, now + 2.0);
                osc2.connect(g2);
                g2.connect(masterBus);
                if (echoInput) g2.connect(echoInput);
                osc2.start(now + 0.08);
                osc2.stop(now + 2.1);
            }
        } catch {
            // Ignore
        }
    }

    /**
     * Envolée de harpe céleste au moment précis où la 12e étoile referme le cœur
     */
    function playHeartCompleteFanfare() {
        const ac = ensureAudio();
        if (!ac || !masterBus) return;

        try {
            const now = ac.currentTime;
            const glissNotes = [293.66, 369.99, 440.00, 554.37, 587.33, 739.99, 880.00, 1174.66, 1479.98];
            glissNotes.forEach((freq, idx) => {
                const t0 = now + idx * 0.068;
                const osc = ac.createOscillator();
                const g = ac.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, t0);

                const lp = ac.createBiquadFilter();
                lp.type = 'lowpass';
                lp.frequency.setValueAtTime(3400, t0);

                g.gain.setValueAtTime(0.0008, t0);
                g.gain.linearRampToValueAtTime(0.095, t0 + 0.02);
                g.gain.exponentialRampToValueAtTime(0.0008, t0 + 2.4);

                osc.connect(lp);
                lp.connect(g);
                g.connect(masterBus);
                if (echoInput) g.connect(echoInput);

                osc.start(t0);
                osc.stop(t0 + 2.5);
            });
        } catch {
            // Ignore
        }
    }

    /* -------------------------------------------------------------------------
       4. MUSIQUE ROMANTIQUE ÉVOLUTIVE : CALME AU RETOUR -> S'EMBALLE AU CŒUR COMPLET
       ------------------------------------------------------------------------- */
    function playSoftPianoNote(ac, freq, startTime, duration, volume, brightness = 1600) {
        const osc = ac.createOscillator();
        const over = ac.createOscillator();
        const filter = ac.createBiquadFilter();
        const gain = ac.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        over.type = 'sine';
        over.frequency.setValueAtTime(freq * 2, startTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(brightness, startTime);
        filter.frequency.exponentialRampToValueAtTime(Math.max(420, brightness * 0.45), startTime + duration);

        const overGain = ac.createGain();
        overGain.gain.setValueAtTime(0.22, startTime);

        gain.gain.setValueAtTime(0.0006, startTime);
        gain.gain.linearRampToValueAtTime(volume, startTime + 0.025);
        gain.gain.exponentialRampToValueAtTime(volume * 0.45, startTime + duration * 0.35);
        gain.gain.exponentialRampToValueAtTime(0.0006, startTime + duration);

        osc.connect(filter);
        over.connect(overGain);
        overGain.connect(filter);
        filter.connect(gain);
        gain.connect(musicBus);
        if (echoInput) gain.connect(echoInput);

        osc.start(startTime);
        over.start(startTime);
        osc.stop(startTime + duration + 0.06);
        over.stop(startTime + duration + 0.06);
    }

    function playWarmPadChord(ac, freqs, startTime, duration, volume, cutoff) {
        freqs.forEach((f, idx) => {
            // Double oscillateur très légèrement désaccordé pour un effet cordes/pad chaleureux
            const detunes = musicMode === 'climax' ? [-6, 6] : [0];
            detunes.forEach((det) => {
                const osc = ac.createOscillator();
                const filter = ac.createBiquadFilter();
                const gain = ac.createGain();

                osc.type = musicMode === 'climax' ? 'sawtooth' : 'sine';
                osc.frequency.setValueAtTime(f, startTime);
                osc.detune.setValueAtTime(det + (idx % 2 === 0 ? -2 : 2), startTime);

                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(cutoff * 0.65, startTime);
                filter.frequency.linearRampToValueAtTime(cutoff, startTime + duration * 0.45);
                filter.frequency.linearRampToValueAtTime(cutoff * 0.72, startTime + duration);

                const voiceVol = volume / (freqs.length * detunes.length);
                gain.gain.setValueAtTime(0.0005, startTime);
                gain.gain.linearRampToValueAtTime(voiceVol, startTime + Math.min(0.95, duration * 0.32));
                gain.gain.setValueAtTime(voiceVol * 0.9, startTime + duration * 0.72);
                gain.gain.exponentialRampToValueAtTime(0.0005, startTime + duration);

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(musicBus);

                osc.start(startTime);
                osc.stop(startTime + duration + 0.08);
            });
        });
    }

    function playBassPulse(ac, freq, startTime, duration, volume) {
        const osc = ac.createOscillator();
        const filter = ac.createBiquadFilter();
        const gain = ac.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(240, startTime);

        gain.gain.setValueAtTime(0.0008, startTime);
        gain.gain.linearRampToValueAtTime(volume, startTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0008, startTime + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(musicBus);

        osc.start(startTime);
        osc.stop(startTime + duration + 0.05);
    }

    function scheduleNextMusicBeat() {
        if (!musicRunning || disposed) return;
        const ac = ensureAudio();
        if (!ac || !musicBus) return;

        const now = ac.currentTime + 0.03;
        const chord = CHORD_PROGRESSION[chordIndex % CHORD_PROGRESSION.length];
        const isClimax = musicMode === 'climax';

        // Rythme : doux et posé (~68 BPM -> 0.44s par croche) puis s'emballe (~108 BPM -> 0.23s par double-croche)
        const stepSec = isClimax ? 0.22 : (0.46 - musicProgress * 0.05);

        if (!isClimax) {
            // --- MODE CALME : Doux piano feutré + nappe nocturne qui s'épanouit au fil du cœur ---
            if (beatStep === 0) {
                const padVol = 0.09 + musicProgress * 0.05;
                const padCut = 520 + musicProgress * 360;
                playWarmPadChord(ac, chord.pad, now, stepSec * 8.4, padVol, padCut);
                playBassPulse(ac, chord.bass, now, stepSec * 4.5, 0.07 + musicProgress * 0.03);
            }

            // Arpège lent et délicat (une note sur 2 au début, puis plus fluide à mesure que le cœur avance)
            const playThisStep = (beatStep % 2 === 0) || (musicProgress >= 0.45 && beatStep === 5) || (musicProgress >= 0.75 && beatStep === 7);
            if (playThisStep) {
                const noteFreq = chord.arpCalm[beatStep % chord.arpCalm.length];
                const noteVol = 0.075 + musicProgress * 0.025;
                const brightness = 1150 + musicProgress * 650;
                playSoftPianoNote(ac, noteFreq, now, stepSec * 3.2, noteVol, brightness);
            }

            // Petite étincelle aiguë subtile quand le cœur dépasse la moitié
            if (musicProgress >= 0.5 && beatStep === 4) {
                playSoftPianoNote(ac, chord.melody[0], now, stepSec * 3.6, 0.045, 2200);
            }

            beatStep = (beatStep + 1) % 8;
            if (beatStep === 0) {
                chordIndex = (chordIndex + 1) % CHORD_PROGRESSION.length;
            }
        } else {
            // --- MODE CLIMAX (« S'EMBALLE ») : Élan lumineux, arpèges rapides, basse battante & mélodie envolée ---
            if (beatStep === 0) {
                // Grande nappe de cordes lumineuses
                playWarmPadChord(ac, chord.pad, now, stepSec * 8.6, 0.22, 1950);
            }

            // Pulsation de basse chaleureuse (battement de cœur dynamique sur temps forts)
            if (beatStep % 2 === 0) {
                const accent = (beatStep === 0 || beatStep === 4) ? 0.17 : 0.11;
                playBassPulse(ac, chord.bass, now, stepSec * 1.85, accent);
                if (beatStep === 0 || beatStep === 4) {
                    playBassPulse(ac, chord.bass * 2, now, stepSec * 1.4, 0.075);
                }
            }

            // Arpèges scintillants rapides en cascade
            const arpFreq = chord.arpClimax[beatStep % chord.arpClimax.length];
            playSoftPianoNote(ac, arpFreq, now, stepSec * 2.4, 0.115, 3200);

            // Doublure scintillante à l'octave supérieure sur les temps pairs
            if (beatStep % 2 === 0) {
                const melNote = chord.melody[(beatStep / 2) % chord.melody.length];
                playSoftPianoNote(ac, melNote, now, stepSec * 2.9, 0.11, 3600);
            }

            beatStep = (beatStep + 1) % 8;
            if (beatStep === 0) {
                chordIndex = (chordIndex + 1) % CHORD_PROGRESSION.length;
            }
        }

        musicTimeoutId = setTimeout(scheduleNextMusicBeat, Math.round(stepSec * 1000));
    }

    function startRomanticMusic() {
        const ac = ensureAudio();
        if (!ac || !musicBus) return;
        if (musicRunning) {
            // Si déjà lancée, assure un volume audible
            musicBus.gain.setTargetAtTime(musicMode === 'climax' ? 0.95 : 0.65, ac.currentTime, 0.6);
            return;
        }
        musicRunning = true;
        musicMode = 'calm';
        chordIndex = 0;
        beatStep = 0;
        musicBus.gain.cancelScheduledValues(ac.currentTime);
        musicBus.gain.setValueAtTime(Math.max(0.0005, musicBus.gain.value), ac.currentTime);
        musicBus.gain.linearRampToValueAtTime(0.68, ac.currentTime + 1.8);
        scheduleNextMusicBeat();
    }

    function setMusicProgress(progress) {
        musicProgress = Math.max(0, Math.min(1, progress));
        if (musicBus && audioCtx && musicRunning && musicMode === 'calm') {
            musicBus.gain.setTargetAtTime(0.68 + musicProgress * 0.14, audioCtx.currentTime, 0.4);
        }
    }

    function triggerMusicClimax() {
        const ac = ensureAudio();
        if (!ac || !musicBus) return;
        musicMode = 'climax';
        musicProgress = 1;
        playHeartCompleteFanfare();

        if (!musicRunning) {
            musicRunning = true;
            chordIndex = 0;
            beatStep = 0;
            musicBus.gain.setValueAtTime(0.001, ac.currentTime);
            musicBus.gain.linearRampToValueAtTime(0.98, ac.currentTime + 0.9);
            scheduleNextMusicBeat();
        } else {
            // Relance immédiatement sur un temps fort pour que la musique s'emballe sans attendre
            if (musicTimeoutId) {
                clearTimeout(musicTimeoutId);
                musicTimeoutId = null;
            }
            beatStep = 0;
            chordIndex = 0;
            musicBus.gain.setTargetAtTime(0.98, ac.currentTime, 0.45);
            musicTimeoutId = setTimeout(scheduleNextMusicBeat, 260);
        }
    }

    function pauseRomanticMusic() {
        if (musicBus && audioCtx && musicRunning && musicMode === 'calm') {
            musicBus.gain.setTargetAtTime(0.08, audioCtx.currentTime, 0.6);
        }
    }

    function stopRomanticMusic() {
        musicRunning = false;
        musicMode = 'idle';
        if (musicTimeoutId) {
            clearTimeout(musicTimeoutId);
            musicTimeoutId = null;
        }
        if (musicBus && audioCtx) {
            try {
                musicBus.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 0.15);
            } catch {
                // Ignore
            }
        }
    }

    function dispose() {
        disposed = true;
        stopRomanticMusic();
        closeAudioContextSafely(audioCtx);
        audioCtx = null;
        masterBus = null;
        musicBus = null;
        echoInput = null;
    }

    return {
        ensureAudio,
        triggerWaveBoom,
        playStarChime,
        startRomanticMusic,
        setMusicProgress,
        triggerMusicClimax,
        pauseRomanticMusic,
        stopRomanticMusic,
        getMusicMode: () => musicMode,
        dispose
    };
}

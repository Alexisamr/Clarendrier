/**
 * ============================================================================
 * DÉCORS & CORTÈGE — GRANDE GALERIE DE L'ÉVOLUTION (MUSÉUM DE PARIS)
 * ============================================================================
 * - Architecture métallique XIXe pré-rendue sur couches GPU (verrière, arches,
 *   coursives et balcons en fer ouvragé, grandes portes monumentales, parquet)
 * - Cortège d'animaux naturalisés détaillés sur 3 plans de profondeur
 *   (éléphants, girafes, zèbres, rhinocéros, lions, antilopes, autruches,
 *   buffle et oiseaux en hauteur sous la verrière)
 * - Rayons de lumière tamisée et reflets doux sur le parquet
 * ============================================================================
 */

import { clamp } from '../utils/helpers.js';
import { MUSEUM_CARAVAN_SPECIES } from '../logic/museumIntroLogic.js';

export function getMuseumLayout(width, height) {
    const horizonY = height * 0.655;
    const verriereBottomY = height * 0.255;
    const centerX = width * 0.5;
    const isNarrow = width < 640;
    const doorHalfW = isNarrow
        ? clamp(width * 0.235, 78, 128)
        : clamp(Math.min(width * 0.165, height * 0.225), 118, 208);
    const doorTopY = horizonY - Math.min(height * 0.425, doorHalfW * 2.55);
    const archCenterY = doorTopY + doorHalfW * 0.92;

    return {
        horizonY,
        verriereBottomY,
        centerX,
        isNarrow,
        doorHalfW,
        doorTopY,
        archCenterY,
        floorSpan: Math.max(120, height - horizonY)
    };
}

/* -------------------------------------------------------------------------
   1. COUCHE LOINTAINE (PARALLAXE FAR) : GRANDE VERRIÈRE & NEF SUPÉRIEURE
   ------------------------------------------------------------------------- */
export function paintFarNaveAndVerriere(ctx, width, height) {
    ctx.clearRect(0, 0, width, height);
    const { centerX, horizonY, verriereBottomY } = getMuseumLayout(width, height);

    // 1. Fond profond chaleureux de la nef
    const wallGrad = ctx.createLinearGradient(0, 0, 0, horizonY + 40);
    wallGrad.addColorStop(0, '#3C2D1F');
    wallGrad.addColorStop(0.28, '#2C2017');
    wallGrad.addColorStop(0.68, '#1E1610');
    wallGrad.addColorStop(1, '#16100C');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 0, width, horizonY + 40);

    // 2. Grande Verrière cintrée lumineuse en haut de la nef
    const skyVaultH = verriereBottomY * 1.08;
    const glassGrad = ctx.createRadialGradient(
        centerX,
        skyVaultH * 0.12,
        width * 0.04,
        centerX,
        skyVaultH * 0.42,
        Math.max(width * 0.68, skyVaultH * 1.45)
    );
    glassGrad.addColorStop(0, 'rgba(255, 249, 232, 0.94)');
    glassGrad.addColorStop(0.28, 'rgba(247, 222, 168, 0.78)');
    glassGrad.addColorStop(0.58, 'rgba(196, 152, 98, 0.42)');
    glassGrad.addColorStop(0.86, 'rgba(84, 62, 44, 0.22)');
    glassGrad.addColorStop(1, 'rgba(34, 24, 18, 0)');

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width, 0);
    ctx.lineTo(width, verriereBottomY * 0.92);
    ctx.quadraticCurveTo(centerX, verriereBottomY * 1.18, 0, verriereBottomY * 0.92);
    ctx.closePath();
    ctx.fillStyle = glassGrad;
    ctx.fill();

    // Panneaux de verre chauds (légères bandes verticales perspective)
    ctx.clip();
    const paneCount = 14;
    for (let i = 0; i <= paneCount; i++) {
        const t = i / paneCount;
        const topX = width * (-0.08 + t * 1.16);
        const botX = centerX + (topX - centerX) * 0.66;
        ctx.strokeStyle = 'rgba(66, 52, 40, 0.36)';
        ctx.lineWidth = i % 2 === 0 ? 2.1 : 1.0;
        ctx.beginPath();
        ctx.moveTo(topX, -6);
        ctx.lineTo(botX, verriereBottomY * 1.12);
        ctx.stroke();
    }

    // Traverses horizontales courbes de la verrière
    for (let r = 1; r <= 5; r++) {
        const ry = (r / 5.4) * verriereBottomY;
        const archDip = Math.sin((r / 5.4) * Math.PI * 0.5) * 24;
        ctx.strokeStyle = r === 5 ? 'rgba(42, 32, 24, 0.72)' : 'rgba(62, 48, 36, 0.42)';
        ctx.lineWidth = r === 5 ? 3.2 : 1.3;
        ctx.beginPath();
        ctx.moveTo(0, ry - archDip * 0.35);
        ctx.quadraticCurveTo(centerX, ry + archDip * 0.85, width, ry - archDip * 0.35);
        ctx.stroke();
    }
    ctx.restore();

    // 3. Grandes arches métalliques cintrées en fer forgé XIXe soutenant la verrière
    const ribArcs = [0.42, 0.68, 0.94];
    for (let i = 0; i < ribArcs.length; i++) {
        const f = ribArcs[i];
        const yEdge = verriereBottomY * (0.45 + f * 0.52);
        const yCrown = verriereBottomY * (0.04 + f * 0.36);

        ctx.strokeStyle = i === 2 ? '#2B221B' : 'rgba(46, 36, 28, 0.78)';
        ctx.lineWidth = i === 2 ? 5.2 : 3.2;
        ctx.beginPath();
        ctx.moveTo(-12, yEdge);
        ctx.quadraticCurveTo(centerX, yCrown, width + 12, yEdge);
        ctx.stroke();

        // Doublure supérieure de poutre treillis + petits anneaux décoratifs XIXe
        ctx.strokeStyle = 'rgba(218, 178, 118, 0.24)';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(-12, yEdge - 7);
        ctx.quadraticCurveTo(centerX, yCrown - 7, width + 12, yEdge - 7);
        ctx.stroke();

        const ringCount = 12;
        for (let k = 1; k < ringCount; k++) {
            const u = k / ringCount;
            const inv = 1 - u;
            const rx = inv * inv * -12 + 2 * inv * u * centerX + u * u * (width + 12);
            const ry = inv * inv * (yEdge - 3.5) + 2 * inv * u * (yCrown - 3.5) + u * u * (yEdge - 3.5);
            ctx.strokeStyle = 'rgba(42, 32, 24, 0.65)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(rx, ry, 3.2, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    // 4. Arcades lointaines du fond de la nef (de chaque côté du futur portail central)
    const farArchY = horizonY * 0.44;
    const farArchH = horizonY * 0.56;
    const archPositions = [0.12, 0.24, 0.36, 0.64, 0.76, 0.88];
    for (let i = 0; i < archPositions.length; i++) {
        const ax = width * archPositions[i];
        const aw = width * 0.085;
        ctx.fillStyle = 'rgba(18, 13, 9, 0.52)';
        ctx.beginPath();
        ctx.moveTo(ax - aw * 0.5, horizonY);
        ctx.lineTo(ax - aw * 0.5, farArchY + aw * 0.5);
        ctx.arc(ax, farArchY + aw * 0.5, aw * 0.5, Math.PI, 0);
        ctx.lineTo(ax + aw * 0.5, horizonY);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(154, 120, 78, 0.25)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
    }

    // Brume dorée douce au fond de la nef
    const mistGrad = ctx.createRadialGradient(
        centerX,
        horizonY * 0.78,
        10,
        centerX,
        horizonY * 0.78,
        width * 0.52
    );
    mistGrad.addColorStop(0, 'rgba(232, 186, 118, 0.26)');
    mistGrad.addColorStop(0.55, 'rgba(164, 118, 68, 0.10)');
    mistGrad.addColorStop(1, 'rgba(24, 17, 12, 0)');
    ctx.fillStyle = mistGrad;
    ctx.fillRect(0, verriereBottomY * 0.6, width, horizonY);
}

/* -------------------------------------------------------------------------
   2. COUCHE INTERMÉDIAIRE (PARALLAXE MID) : COURSIVES, BALCONS & COLONNES FER
   ------------------------------------------------------------------------- */
function drawBalconyWing(ctx, side, width, height, horizonY, verriereBottomY) {
    const isLeft = side === 'left';
    const outerX = isLeft ? 0 : width;
    const dir = isLeft ? 1 : -1;
    const wingSpan = width < 640 ? width * 0.29 : width * 0.34;
    const innerX = outerX + dir * wingSpan;

    // 2 étages de balcons / coursives en fer ouvragé
    const tiers = [
        { outerY: verriereBottomY * 1.18, innerY: verriereBottomY * 1.38, railH: height * 0.052 },
        { outerY: horizonY * 0.66, innerY: horizonY * 0.72, railH: height * 0.056 }
    ];

    // Fines colonnes de fonte XIXe s'élevant du sol jusqu'aux arches de la verrière
    const colFractions = [0.16, 0.56, 0.94];
    for (let c = 0; c < colFractions.length; c++) {
        const f = colFractions[c];
        const cx = outerX + dir * wingSpan * f;
        const topY = verriereBottomY * (0.86 + f * 0.22);
        const colW = (1 - f * 0.35) * (width < 640 ? 6.5 : 9.0);

        // Ombre interne de la galerie derrière les colonnes
        if (c === 0) {
            const alcoveGrad = ctx.createLinearGradient(outerX, 0, innerX, 0);
            alcoveGrad.addColorStop(0, 'rgba(15, 11, 8, 0.72)');
            alcoveGrad.addColorStop(0.75, 'rgba(26, 19, 13, 0.38)');
            alcoveGrad.addColorStop(1, 'rgba(26, 19, 13, 0)');
            ctx.fillStyle = alcoveGrad;
            ctx.fillRect(isLeft ? 0 : innerX, verriereBottomY * 0.85, wingSpan, horizonY - verriereBottomY * 0.85);
        }

        // Fût métallique fin avec reflet bronze chaud
        const colGrad = ctx.createLinearGradient(cx - colW, 0, cx + colW, 0);
        colGrad.addColorStop(0, '#1D1713');
        colGrad.addColorStop(0.45, '#4A3B2E');
        colGrad.addColorStop(0.68, '#7A6146');
        colGrad.addColorStop(1, '#1B1511');
        ctx.fillStyle = colGrad;
        ctx.fillRect(cx - colW * 0.5, topY, colW, horizonY - topY);

        // Chapiteau ouvragé en haut + bagues aux niveaux des balcons
        ctx.fillStyle = '#6A533C';
        ctx.fillRect(cx - colW * 0.95, topY - 4, colW * 1.9, 6);
        ctx.fillRect(cx - colW * 0.8, topY + 2, colW * 1.6, 3);

        // Socle de colonne en fonte
        ctx.fillStyle = '#2B221B';
        ctx.fillRect(cx - colW * 0.9, horizonY - 12, colW * 1.8, 12);
    }

    // Arches métalliques en plein cintre reliant les colonnes de la galerie
    for (let c = 0; c < colFractions.length - 1; c++) {
        const x1 = outerX + dir * wingSpan * colFractions[c];
        const x2 = outerX + dir * wingSpan * colFractions[c + 1];
        const y1 = verriereBottomY * (0.94 + colFractions[c] * 0.2);
        const y2 = verriereBottomY * (0.94 + colFractions[c + 1] * 0.2);
        const midX = (x1 + x2) * 0.5;
        const archPeakY = Math.min(y1, y2) - Math.abs(x2 - x1) * 0.28;

        ctx.strokeStyle = '#332820';
        ctx.lineWidth = 3.6;
        ctx.beginPath();
        ctx.moveTo(x1, y1 + 18);
        ctx.quadraticCurveTo(midX, archPeakY, x2, y2 + 18);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(218, 178, 118, 0.34)';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(x1, y1 + 15);
        ctx.quadraticCurveTo(midX, archPeakY - 2, x2, y2 + 15);
        ctx.stroke();
    }

    // Balcons & garde-corps en fer forgé sur les deux étages
    for (let t = 0; t < tiers.length; t++) {
        const tier = tiers[t];
        const yOut = tier.outerY;
        const yIn = tier.innerY;
        const rH = tier.railH;

        // Plancher / corniche du balcon
        ctx.fillStyle = '#251D17';
        ctx.beginPath();
        ctx.moveTo(outerX, yOut);
        ctx.lineTo(innerX, yIn);
        ctx.lineTo(innerX, yIn + 9);
        ctx.lineTo(outerX, yOut + 12);
        ctx.closePath();
        ctx.fill();

        // Liseré doré sous la corniche (reflet de la verrière)
        ctx.strokeStyle = 'rgba(214, 172, 112, 0.42)';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(outerX, yOut + 1);
        ctx.lineTo(innerX, yIn + 1);
        ctx.stroke();

        // Main courante supérieure du garde-corps
        ctx.strokeStyle = '#6D543B';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(outerX, yOut - rH);
        ctx.lineTo(innerX, yIn - rH * 0.84);
        ctx.stroke();

        // Barreaux verticaux & volutes ouvragées en fer forgé
        const barCount = width < 640 ? 11 : 17;
        for (let b = 0; b <= barCount; b++) {
            const u = b / barCount;
            const bx = outerX + dir * wingSpan * u;
            const byBot = yOut + (yIn - yOut) * u;
            const byTop = (yOut - rH) + ((yIn - rH * 0.84) - (yOut - rH)) * u;

            ctx.strokeStyle = 'rgba(54, 42, 33, 0.92)';
            ctx.lineWidth = b % 3 === 0 ? 1.8 : 1.05;
            ctx.beginPath();
            ctx.moveTo(bx, byBot);
            ctx.lineTo(bx, byTop);
            ctx.stroke();

            // Petit médaillon / volute entre chaque paire de barreaux
            if (b < barCount && b % 2 === 0) {
                const nextU = (b + 1) / barCount;
                const mx = outerX + dir * wingSpan * ((u + nextU) * 0.5);
                const my = (byBot + byTop) * 0.5;
                const rx = Math.max(2.2, (wingSpan / barCount) * 0.36);
                const ry = Math.max(3.5, Math.abs(byBot - byTop) * 0.28);

                ctx.strokeStyle = 'rgba(148, 114, 74, 0.46)';
                ctx.lineWidth = 0.95;
                ctx.beginPath();
                ctx.ellipse(mx, my, rx, ry, 0, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        // Petites appliques lumineuses chaudes sur les coursives
        const lampU = 0.44;
        const lx = outerX + dir * wingSpan * lampU;
        const ly = (yOut + (yIn - yOut) * lampU) - rH * 1.45;
        const lampGlow = ctx.createRadialGradient(lx, ly, 1, lx, ly, 26);
        lampGlow.addColorStop(0, 'rgba(255, 232, 166, 0.72)');
        lampGlow.addColorStop(0.45, 'rgba(232, 168, 86, 0.24)');
        lampGlow.addColorStop(1, 'rgba(232, 168, 86, 0)');
        ctx.fillStyle = lampGlow;
        ctx.beginPath();
        ctx.arc(lx, ly, 26, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFF2C6';
        ctx.beginPath();
        ctx.arc(lx, ly, 2.4, 0, Math.PI * 2);
        ctx.fill();
    }
}

export function paintMidIronBalconies(ctx, width, height) {
    ctx.clearRect(0, 0, width, height);
    const { horizonY, verriereBottomY } = getMuseumLayout(width, height);
    drawBalconyWing(ctx, 'left', width, height, horizonY, verriereBottomY);
    drawBalconyWing(ctx, 'right', width, height, horizonY, verriereBottomY);
}

/* -------------------------------------------------------------------------
   3. GRANDES PORTES DU MUSÉUM + PARQUET RÉFLÉCHISSANT (MOITIÉ GAUCHE / DROITE)
   ------------------------------------------------------------------------- */
export function paintMuseumPortalHalf(ctx, width, height, side) {
    ctx.clearRect(0, 0, width, height);
    const isLeft = side === 'left';
    const {
        centerX,
        horizonY,
        doorHalfW,
        doorTopY,
        archCenterY,
        floorSpan
    } = getMuseumLayout(width, height);

    ctx.save();
    // Clip strict gauche / droite au milieu (léger recouvrement de 1.5px à gauche pour jointure invisible)
    ctx.beginPath();
    if (isLeft) {
        ctx.rect(0, 0, centerX + 1.5, height);
    } else {
        ctx.rect(centerX, 0, width - centerX, height);
    }
    ctx.clip();

    // --- A. PORTAIL ARCHITECTURAL EN PIERRE & FONTE AUTOUR DES GRANDES PORTES ---
    const framePad = Math.max(14, doorHalfW * 0.14);
    const outerRadius = doorHalfW + framePad;

    const stoneGrad = ctx.createLinearGradient(
        centerX - outerRadius,
        doorTopY,
        centerX + outerRadius,
        horizonY
    );
    stoneGrad.addColorStop(0, '#4E3D2E');
    stoneGrad.addColorStop(0.5, '#6C5642');
    stoneGrad.addColorStop(1, '#3B2D22');

    ctx.fillStyle = stoneGrad;
    ctx.beginPath();
    ctx.moveTo(centerX - outerRadius, horizonY + 4);
    ctx.lineTo(centerX - outerRadius, archCenterY);
    ctx.arc(centerX, archCenterY, outerRadius, Math.PI, 0);
    ctx.lineTo(centerX + outerRadius, horizonY + 4);
    ctx.closePath();
    ctx.fill();

    // Moulure dorée / bronze de l'encadrement cintré
    ctx.strokeStyle = 'rgba(218, 178, 114, 0.52)';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Clé de voûte sculptée au sommet de l'arche
    ctx.fillStyle = '#7E6449';
    ctx.beginPath();
    ctx.moveTo(centerX - 11, archCenterY - outerRadius - 3);
    ctx.lineTo(centerX + 11, archCenterY - outerRadius - 3);
    ctx.lineTo(centerX + 8, archCenterY - doorHalfW + 4);
    ctx.lineTo(centerX - 8, archCenterY - doorHalfW + 4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(232, 196, 134, 0.45)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // --- B. IMPOSTE VITRÉE CINTRÉE EN FER FORGÉ AU-DESSUS DES BATTANTS ---
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(centerX - doorHalfW, archCenterY);
    ctx.arc(centerX, archCenterY, doorHalfW, Math.PI, 0);
    ctx.closePath();
    const transomGrad = ctx.createRadialGradient(
        centerX,
        archCenterY,
        4,
        centerX,
        archCenterY,
        doorHalfW
    );
    transomGrad.addColorStop(0, '#E8C589');
    transomGrad.addColorStop(0.55, '#9F7444');
    transomGrad.addColorStop(1, '#4C3320');
    ctx.fillStyle = transomGrad;
    ctx.fill();
    ctx.clip();

    // Rayons en éventail en fer forgé dans l'imposte
    ctx.strokeStyle = '#241811';
    ctx.lineWidth = 2.4;
    for (let a = 1; a <= 7; a++) {
        const angle = Math.PI + (a / 8) * Math.PI;
        ctx.beginPath();
        ctx.moveTo(centerX, archCenterY);
        ctx.lineTo(
            centerX + Math.cos(angle) * doorHalfW * 1.05,
            archCenterY + Math.sin(angle) * doorHalfW * 1.05
        );
        ctx.stroke();
    }
    // Demi-cercles concentriques de ferronnerie
    ctx.beginPath();
    ctx.arc(centerX, archCenterY, doorHalfW * 0.56, Math.PI, 0);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(236, 198, 128, 0.45)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(centerX, archCenterY, doorHalfW * 0.78, Math.PI, 0);
    ctx.stroke();
    ctx.restore();

    // Traverse horizontale en bronze séparant l'imposte des grands battants
    ctx.fillStyle = '#2B1D14';
    ctx.fillRect(centerX - doorHalfW - 4, archCenterY - 4, doorHalfW * 2 + 8, 9);
    ctx.strokeStyle = 'rgba(222, 182, 118, 0.48)';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(centerX - doorHalfW - 4, archCenterY - 4, doorHalfW * 2 + 8, 9);

    // --- C. GRANDS BATTANTS EN CHÊNE SCULPTÉ & BRONZE DU MUSÉUM ---
    const leafTop = archCenterY + 5;
    const leafH = Math.max(60, horizonY - leafTop);
    const leafX = isLeft ? centerX - doorHalfW : centerX;

    const woodGrad = ctx.createLinearGradient(leafX, leafTop, leafX + doorHalfW, horizonY);
    woodGrad.addColorStop(0, isLeft ? '#3E2517' : '#4E301D');
    woodGrad.addColorStop(0.5, '#352014');
    woodGrad.addColorStop(1, '#23140C');
    ctx.fillStyle = woodGrad;
    ctx.fillRect(leafX, leafTop, doorHalfW, leafH + 4);

    // Cadre en relief sur le battant
    const padX = Math.max(9, doorHalfW * 0.14);
    const padY = Math.max(10, leafH * 0.06);
    const innerW = Math.max(16, doorHalfW - padX * 2);

    // Panneau haut avec grille vitrée ouvragée
    const upperH = leafH * 0.46;
    const upperY = leafTop + padY;
    ctx.fillStyle = '#291910';
    ctx.fillRect(leafX + padX, upperY, innerW, upperH);
    ctx.strokeStyle = 'rgba(204, 162, 102, 0.52)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(leafX + padX, upperY, innerW, upperH);

    // Vitre chaude tamisée + ferronnerie en losange dans le panneau supérieur
    const paneGrad = ctx.createLinearGradient(leafX + padX, upperY, leafX + padX, upperY + upperH);
    paneGrad.addColorStop(0, 'rgba(232, 190, 124, 0.42)');
    paneGrad.addColorStop(0.55, 'rgba(164, 114, 64, 0.28)');
    paneGrad.addColorStop(1, 'rgba(84, 52, 28, 0.22)');
    ctx.fillStyle = paneGrad;
    ctx.fillRect(leafX + padX + 4, upperY + 4, innerW - 8, upperH - 8);

    ctx.strokeStyle = '#21150E';
    ctx.lineWidth = 1.6;
    const midPaneX = leafX + padX + innerW * 0.5;
    const midPaneY = upperY + upperH * 0.5;
    ctx.beginPath();
    ctx.moveTo(midPaneX, upperY + 4);
    ctx.lineTo(midPaneX, upperY + upperH - 4);
    ctx.moveTo(leafX + padX + 4, midPaneY);
    ctx.lineTo(leafX + padX + innerW - 4, midPaneY);
    // Losange central en fer forgé
    ctx.moveTo(midPaneX, upperY + upperH * 0.16);
    ctx.lineTo(leafX + padX + innerW * 0.82, midPaneY);
    ctx.lineTo(midPaneX, upperY + upperH * 0.84);
    ctx.lineTo(leafX + padX + innerW * 0.18, midPaneY);
    ctx.closePath();
    ctx.stroke();

    // Rosace dorée au centre du losange
    ctx.fillStyle = '#C99B58';
    ctx.beginPath();
    ctx.arc(midPaneX, midPaneY, 3.6, 0, Math.PI * 2);
    ctx.fill();

    // Panneau bas en boiserie moulurée
    const lowerY = upperY + upperH + padY * 1.15;
    const lowerH = Math.max(20, horizonY - lowerY - padY * 0.9);
    ctx.fillStyle = '#2B1910';
    ctx.fillRect(leafX + padX, lowerY, innerW, lowerH);
    ctx.strokeStyle = 'rgba(196, 152, 96, 0.45)';
    ctx.lineWidth = 1.4;
    ctx.strokeRect(leafX + padX, lowerY, innerW, lowerH);
    ctx.strokeStyle = 'rgba(18, 10, 6, 0.6)';
    ctx.lineWidth = 1.1;
    ctx.strokeRect(leafX + padX + 5, lowerY + 5, Math.max(6, innerW - 10), Math.max(6, lowerH - 10));

    // Poignée monumentale en laiton doré près du joint central
    const handleX = isLeft ? centerX - Math.max(10, doorHalfW * 0.12) : centerX + Math.max(10, doorHalfW * 0.12);
    const handleY = leafTop + leafH * 0.58;
    ctx.fillStyle = '#C89B54';
    ctx.beginPath();
    ctx.roundRect(handleX - 3, handleY - 13, 6, 26, 3);
    ctx.fill();
    ctx.strokeStyle = '#F5DC9C';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(handleX, handleY + 2, 5.2, 0, Math.PI * 2);
    ctx.stroke();

    // Filet d'ombre centrale entre les deux battants fermés
    ctx.strokeStyle = '#120A06';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(centerX, doorTopY);
    ctx.lineTo(centerX, horizonY);
    ctx.stroke();

    // --- D. PARQUET CHÊNE EN PERSPECTIVE AVEC REFLETS DE LA VERRIÈRE ---
    const parquetGrad = ctx.createLinearGradient(0, horizonY, 0, height);
    parquetGrad.addColorStop(0, '#5E3F27');
    parquetGrad.addColorStop(0.22, '#6C4A2E');
    parquetGrad.addColorStop(0.58, '#4E331E');
    parquetGrad.addColorStop(1, '#2D1C11');
    ctx.fillStyle = parquetGrad;
    ctx.fillRect(0, horizonY, width, floorSpan + 2);

    // Reflet lumineux chaud de la verrière et des portes sur le parquet ciré
    const floorSheen = ctx.createRadialGradient(
        centerX,
        horizonY + floorSpan * 0.16,
        14,
        centerX,
        horizonY + floorSpan * 0.42,
        Math.max(width * 0.46, floorSpan * 0.95)
    );
    floorSheen.addColorStop(0, 'rgba(255, 224, 158, 0.36)');
    floorSheen.addColorStop(0.45, 'rgba(222, 170, 102, 0.15)');
    floorSheen.addColorStop(1, 'rgba(180, 128, 70, 0)');
    ctx.fillStyle = floorSheen;
    ctx.fillRect(0, horizonY, width, floorSpan);

    // Lames de parquet en perspective fuyant vers le centre des portes
    const plankCount = 26;
    ctx.strokeStyle = 'rgba(34, 20, 11, 0.34)';
    ctx.lineWidth = 1.05;
    for (let p = 0; p <= plankCount; p++) {
        const t = p / plankCount;
        const botX = width * (-0.35 + t * 1.7);
        const topX = centerX + (botX - centerX) * 0.24;
        ctx.beginPath();
        ctx.moveTo(topX, horizonY);
        ctx.lineTo(botX, height + 2);
        ctx.stroke();
    }

    // Joints transversaux / motifs point de Hongrie discrets
    const rowCount = 12;
    for (let r = 1; r <= rowCount; r++) {
        const u = Math.pow(r / rowCount, 1.55);
        const ry = horizonY + u * floorSpan;
        ctx.strokeStyle = `rgba(32, 18, 10, ${(0.18 + u * 0.16).toFixed(3)})`;
        ctx.lineWidth = 0.8 + u * 0.7;
        ctx.beginPath();
        ctx.moveTo(0, ry);
        ctx.lineTo(width, ry);
        ctx.stroke();

        // Subtil reflet clair sur le bord des lames cirées
        ctx.strokeStyle = `rgba(255, 226, 174, ${(0.07 * (1 - u * 0.5)).toFixed(3)})`;
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(centerX - width * (0.14 + u * 0.22), ry + 1.2);
        ctx.lineTo(centerX + width * (0.14 + u * 0.22), ry + 1.2);
        ctx.stroke();
    }

    // Allée centrale subtilement encadrée de laiton (guidant Alexis & Clara vers les portes)
    const aisleTopHalf = doorHalfW * 0.76;
    const aisleBotHalf = Math.min(width * 0.26, doorHalfW * 1.48);
    ctx.strokeStyle = 'rgba(218, 176, 110, 0.34)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(centerX - aisleTopHalf, horizonY + 2);
    ctx.lineTo(centerX - aisleBotHalf, height + 2);
    ctx.moveTo(centerX + aisleTopHalf, horizonY + 2);
    ctx.lineTo(centerX + aisleBotHalf, height + 2);
    ctx.stroke();

    // Ligne d'ombre douce à la jonction murs / parquet
    const seamShadow = ctx.createLinearGradient(0, horizonY - 4, 0, horizonY + 24);
    seamShadow.addColorStop(0, 'rgba(14, 9, 6, 0.55)');
    seamShadow.addColorStop(1, 'rgba(14, 9, 6, 0)');
    ctx.fillStyle = seamShadow;
    ctx.fillRect(0, horizonY, width, 24);

    // Fines colonnes de premier plan encadrant les bords gauche/droit de l'écran
    const edgeColW = width < 640 ? 12 : 20;
    const edgeX = isLeft ? 0 : width - edgeColW;
    const edgeGrad = ctx.createLinearGradient(edgeX, 0, edgeX + edgeColW, 0);
    edgeGrad.addColorStop(0, '#16110D');
    edgeGrad.addColorStop(0.55, '#3A2D22');
    edgeGrad.addColorStop(1, '#140F0C');
    ctx.fillStyle = edgeGrad;
    ctx.fillRect(edgeX, 0, edgeColW, height);

    ctx.restore();
}

/* -------------------------------------------------------------------------
   4. RAYONS DE LUMIÈRE CHAUDE & TAMISÉE DE LA VERRIÈRE
   ------------------------------------------------------------------------- */
export function drawSunbeams(ctx, width, height, elapsed, lightPulse, bgFade) {
    if (bgFade <= 0.01) return;

    const beams = [
        { topNx: 0.22, botNx: 0.14, topW: 0.06, botW: 0.15, phase: 0.2, alpha: 0.14 },
        { topNx: 0.36, botNx: 0.29, topW: 0.07, botW: 0.17, phase: 1.4, alpha: 0.18 },
        { topNx: 0.49, botNx: 0.48, topW: 0.09, botW: 0.22, phase: 2.3, alpha: 0.22 },
        { topNx: 0.62, botNx: 0.68, topW: 0.07, botW: 0.17, phase: 3.1, alpha: 0.17 },
        { topNx: 0.77, botNx: 0.85, topW: 0.06, botW: 0.15, phase: 4.4, alpha: 0.13 }
    ];

    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    for (let i = 0; i < beams.length; i++) {
        const b = beams[i];
        const drift = Math.sin(elapsed * 0.48 + b.phase) * width * 0.012;
        const localPulse = 0.84 + 0.16 * Math.sin(elapsed * 0.92 + b.phase * 1.3);
        const beamAlpha = b.alpha * lightPulse * localPulse * bgFade;

        const tx = b.topNx * width + drift * 0.4;
        const bx = b.botNx * width + drift;
        const tw = b.topW * width;
        const bw = b.botW * width;
        const botY = height * 0.88;

        const grad = ctx.createLinearGradient(tx, 0, bx, botY);
        grad.addColorStop(0, `rgba(255, 245, 214, ${(beamAlpha * 1.15).toFixed(3)})`);
        grad.addColorStop(0.45, `rgba(246, 206, 136, ${(beamAlpha * 0.72).toFixed(3)})`);
        grad.addColorStop(0.85, `rgba(222, 170, 98, ${(beamAlpha * 0.25).toFixed(3)})`);
        grad.addColorStop(1, 'rgba(222, 170, 98, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(tx - tw * 0.5, 0);
        ctx.lineTo(tx + tw * 0.5, 0);
        ctx.lineTo(bx + bw * 0.5, botY);
        ctx.lineTo(bx - bw * 0.5, botY);
        ctx.closePath();
        ctx.fill();
    }

    ctx.restore();
}

/* -------------------------------------------------------------------------
   4b. LUSTRE / LANTERNES SUSPENDUES & REFLET DORÉ DES PORTES SUR LE PARQUET
   ------------------------------------------------------------------------- */
export function drawLivingGalleryAccents(ctx, width, height, frame, elapsed) {
    const { centerX, horizonY, verriereBottomY, doorHalfW, floorSpan } = getMuseumLayout(width, height);
    const { bgFade, lightPulse, doors } = frame;

    // 1. Petites lanternes suspendues en laiton qui oscillent très légèrement sous les arches
    if (bgFade > 0.02) {
        const lanterns = [
            { nx: 0.17, len: verriereBottomY * 0.42, phase: 0.4 },
            { nx: 0.83, len: verriereBottomY * 0.42, phase: 2.1 }
        ];
        ctx.save();
        ctx.globalAlpha = bgFade;
        for (let i = 0; i < lanterns.length; i++) {
            const l = lanterns[i];
            const anchorX = l.nx * width;
            const anchorY = verriereBottomY * 0.82;
            const sway = Math.sin(elapsed * 1.05 + l.phase) * 3.5;
            const gx = anchorX + sway;
            const gy = anchorY + l.len;

            ctx.strokeStyle = 'rgba(44, 34, 24, 0.72)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(anchorX, anchorY);
            ctx.lineTo(gx, gy);
            ctx.stroke();

            const haloR = 24 * (0.9 + 0.12 * lightPulse);
            const halo = ctx.createRadialGradient(gx, gy + 4, 1.5, gx, gy + 4, haloR);
            halo.addColorStop(0, 'rgba(255, 240, 188, 0.78)');
            halo.addColorStop(0.45, 'rgba(235, 178, 96, 0.25)');
            halo.addColorStop(1, 'rgba(235, 178, 96, 0)');
            ctx.fillStyle = halo;
            ctx.beginPath();
            ctx.arc(gx, gy + 4, haloR, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#FFF5D0';
            ctx.beginPath();
            ctx.arc(gx, gy + 4, 3.0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    // 2. Reflet lumineux doré qui s'allonge sur le parquet devant les grandes portes quand elles s'ouvrent
    const spillAlpha = doors.glowRise * (1 - doors.splitProgress * 0.85);
    if (spillAlpha > 0.01) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const spillW = doorHalfW * (0.45 + doors.splitProgress * 1.45);
        const spillGrad = ctx.createLinearGradient(0, horizonY, 0, horizonY + floorSpan * 0.82);
        spillGrad.addColorStop(0, `rgba(255, 240, 190, ${(0.56 * spillAlpha).toFixed(3)})`);
        spillGrad.addColorStop(0.45, `rgba(244, 202, 128, ${(0.28 * spillAlpha).toFixed(3)})`);
        spillGrad.addColorStop(1, 'rgba(244, 202, 128, 0)');
        ctx.fillStyle = spillGrad;
        ctx.beginPath();
        ctx.moveTo(centerX - spillW * 0.42, horizonY);
        ctx.lineTo(centerX + spillW * 0.42, horizonY);
        ctx.lineTo(centerX + spillW * 1.38, horizonY + floorSpan * 0.82);
        ctx.lineTo(centerX - spillW * 1.38, horizonY + floorSpan * 0.82);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

/* -------------------------------------------------------------------------
   5. DESSIN DÉTAILLÉ DES ANIMAUX NATURALISÉS DU CORTÈGE
      (Origine locale (0, 0) = pieds au sol, orientation par défaut vers +X)
   ------------------------------------------------------------------------- */
function drawAnimalGroundShadow(ctx, rx, ry) {
    ctx.fillStyle = 'rgba(14, 9, 6, 0.40)';
    ctx.beginPath();
    ctx.ellipse(0, 1.5, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
}

function drawElephant(ctx) {
    drawAnimalGroundShadow(ctx, 44, 8.0);

    // Pattes arrière (ombrées, galbe naturel avec genou et cheville)
    ctx.fillStyle = '#3B3631';
    ctx.beginPath();
    ctx.moveTo(-24, -29);
    ctx.lineTo(-14, -29);
    ctx.lineTo(-13, -1);
    ctx.lineTo(-22, -1);
    ctx.closePath();
    ctx.moveTo(10, -29);
    ctx.lineTo(20, -29);
    ctx.lineTo(22, -1);
    ctx.lineTo(12, -1);
    ctx.closePath();
    ctx.fill();

    // Défense lointaine (profondeur 3D)
    ctx.strokeStyle = '#D5C6A8';
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(43, -44);
    ctx.quadraticCurveTo(54, -40, 58, -48);
    ctx.stroke();

    // Queue fine avec touffe
    ctx.strokeStyle = '#3C3732';
    ctx.lineWidth = 2.1;
    ctx.beginPath();
    ctx.moveTo(-34, -46);
    ctx.quadraticCurveTo(-42, -34, -39, -22);
    ctx.stroke();
    ctx.fillStyle = '#2B2622';
    ctx.beginPath();
    ctx.ellipse(-39, -21, 2.0, 3.6, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Corps massif d'éléphant d'Afrique (dos en selle caractéristique)
    const bodyGrad = ctx.createLinearGradient(0, -72, 0, -14);
    bodyGrad.addColorStop(0, '#91887C');
    bodyGrad.addColorStop(0.42, '#6A6259');
    bodyGrad.addColorStop(1, '#3E3933');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.moveTo(-35, -43);
    ctx.bezierCurveTo(-36, -61, -20, -68, -6, -65);
    ctx.bezierCurveTo(6, -63, 18, -71, 30, -62);
    ctx.bezierCurveTo(36, -55, 36, -42, 33, -33);
    ctx.bezierCurveTo(26, -21, 10, -20, -4, -22);
    ctx.bezierCurveTo(-22, -22, -32, -28, -35, -43);
    ctx.closePath();
    ctx.fill();

    // Reflet chaud de la verrière sur le dos et la croupe
    ctx.strokeStyle = 'rgba(248, 218, 164, 0.42)';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(-27, -58);
    ctx.quadraticCurveTo(-5, -66, 22, -64);
    ctx.stroke();

    // Pattes avant sculptées
    const legGrad = ctx.createLinearGradient(0, -35, 0, 0);
    legGrad.addColorStop(0, '#665E55');
    legGrad.addColorStop(1, '#443E38');
    ctx.fillStyle = legGrad;
    ctx.beginPath();
    ctx.moveTo(-31, -35);
    ctx.lineTo(-19, -33);
    ctx.lineTo(-20, -1);
    ctx.lineTo(-30, -1);
    ctx.closePath();
    ctx.moveTo(15, -35);
    ctx.lineTo(27, -34);
    ctx.lineTo(29, -1);
    ctx.lineTo(18, -1);
    ctx.closePath();
    ctx.fill();

    // Plis de peau subtils aux genoux & flancs
    ctx.strokeStyle = 'rgba(34, 30, 26, 0.34)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(-28, -17);
    ctx.lineTo(-21, -17);
    ctx.moveTo(18, -18);
    ctx.lineTo(26, -18);
    ctx.stroke();

    // Petits ongles ivoire
    ctx.fillStyle = '#CFC3AE';
    ctx.fillRect(-29, -2.6, 3.0, 2.6);
    ctx.fillRect(-24.5, -2.6, 3.0, 2.6);
    ctx.fillRect(19.5, -2.6, 3.0, 2.6);
    ctx.fillRect(24, -2.6, 3.0, 2.6);

    // Tête et front bombé
    ctx.fillStyle = '#736B61';
    ctx.beginPath();
    ctx.ellipse(34, -54, 13.5, 14.5, -0.08, 0, Math.PI * 2);
    ctx.fill();

    // Trompe longue légèrement courbée avec bout fin
    ctx.strokeStyle = '#635B52';
    ctx.lineWidth = 7.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(44, -49);
    ctx.bezierCurveTo(51, -35, 48, -18, 55, -13);
    ctx.stroke();
    ctx.strokeStyle = '#534C44';
    ctx.lineWidth = 4.2;
    ctx.beginPath();
    ctx.moveTo(52, -16);
    ctx.quadraticCurveTo(58, -11, 59, -16);
    ctx.stroke();

    // Grande oreille d'éléphant d'Afrique (ourlée et sculptée)
    ctx.fillStyle = '#534B44';
    ctx.beginPath();
    ctx.moveTo(29, -65);
    ctx.bezierCurveTo(10, -70, 2, -52, 10, -38);
    ctx.bezierCurveTo(18, -30, 29, -37, 31, -50);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(224, 190, 140, 0.28)';
    ctx.lineWidth = 1.1;
    ctx.stroke();

    // Grande défense en ivoire courbée (premier plan)
    ctx.strokeStyle = '#F6EBD0';
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.moveTo(40, -43);
    ctx.quadraticCurveTo(54, -37, 61, -46);
    ctx.stroke();

    // Œil discret
    ctx.fillStyle = '#1D1814';
    ctx.beginPath();
    ctx.arc(38, -55, 1.5, 0, Math.PI * 2);
    ctx.fill();
}

function drawGiraffe(ctx) {
    drawAnimalGroundShadow(ctx, 25, 5.5);

    // 4 longues pattes fines avec sabots sombres
    ctx.strokeStyle = '#9C723A';
    ctx.lineWidth = 3.1;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-12, -40);
    ctx.lineTo(-14, -2);
    ctx.moveTo(10, -44);
    ctx.lineTo(12, -2);
    ctx.stroke();

    ctx.strokeStyle = '#CE9C55';
    ctx.lineWidth = 3.3;
    ctx.beginPath();
    ctx.moveTo(-16, -40);
    ctx.lineTo(-19, -2);
    ctx.moveTo(14, -44);
    ctx.lineTo(17, -2);
    ctx.stroke();

    ctx.fillStyle = '#2B1F16';
    ctx.fillRect(-20.4, -3, 2.8, 3);
    ctx.fillRect(-15.4, -3, 2.8, 3);
    ctx.fillRect(10.6, -3, 2.8, 3);
    ctx.fillRect(15.6, -3, 2.8, 3);

    // Queue avec touffe brune
    ctx.strokeStyle = '#9F733A';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-18, -46);
    ctx.quadraticCurveTo(-24, -36, -22, -25);
    ctx.stroke();
    ctx.fillStyle = '#4B2F18';
    ctx.beginPath();
    ctx.ellipse(-22, -24, 2.2, 4, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Corps incliné + long cou élancé
    const coatGrad = ctx.createLinearGradient(0, -112, 0, -36);
    coatGrad.addColorStop(0, '#E6B96D');
    coatGrad.addColorStop(0.55, '#CC984D');
    coatGrad.addColorStop(1, '#9E7034');
    ctx.fillStyle = coatGrad;
    ctx.beginPath();
    ctx.moveTo(-19, -42);
    ctx.quadraticCurveTo(-15, -56, 8, -60);
    ctx.lineTo(24, -106);
    ctx.lineTo(31, -104);
    ctx.lineTo(19, -54);
    ctx.quadraticCurveTo(16, -39, -12, -37);
    ctx.closePath();
    ctx.fill();

    // Tête fine, oreille & ossicônes
    ctx.fillStyle = '#DCA95C';
    ctx.beginPath();
    ctx.ellipse(31, -106, 7.8, 4.0, 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#6A4120';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(26, -110);
    ctx.lineTo(25, -116);
    ctx.moveTo(29, -110);
    ctx.lineTo(29, -116);
    ctx.stroke();

    // Taches marron caractéristiques sur le corps et le cou
    const spots = [
        [-11, -46, 3.6, 2.8],
        [-3, -50, 4.0, 3.1],
        [5, -45, 3.5, 2.9],
        [11, -53, 3.8, 3.0],
        [16, -64, 3.2, 2.7],
        [19, -74, 2.9, 2.5],
        [22, -84, 2.7, 2.3],
        [25, -94, 2.3, 2.0]
    ];
    ctx.fillStyle = '#6E401D';
    for (let i = 0; i < spots.length; i++) {
        const [sx, sy, rx, ry] = spots[i];
        ctx.beginPath();
        ctx.ellipse(sx, sy, rx, ry, 0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    // Crinière sombre le long de l'arrière du cou
    ctx.strokeStyle = '#533015';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(9, -60);
    ctx.lineTo(23, -105);
    ctx.stroke();
}

function drawZebra(ctx) {
    drawAnimalGroundShadow(ctx, 25, 5.2);

    // Pattes arrière ombrées
    ctx.strokeStyle = '#C4B9A6';
    ctx.lineWidth = 3.3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-12, -23);
    ctx.lineTo(-14, -2);
    ctx.moveTo(10, -23);
    ctx.lineTo(12, -2);
    ctx.stroke();

    // Pattes avant + sabots noirs
    ctx.strokeStyle = '#F2E9D8';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-16, -23);
    ctx.lineTo(-19, -2);
    ctx.moveTo(13, -23);
    ctx.lineTo(17, -2);
    ctx.stroke();

    ctx.fillStyle = '#1E1A17';
    ctx.fillRect(-20.5, -3.2, 3.2, 3.2);
    ctx.fillRect(-15.5, -3.2, 3.2, 3.2);
    ctx.fillRect(10.5, -3.2, 3.2, 3.2);
    ctx.fillRect(15.5, -3.2, 3.2, 3.2);

    // Corps, encolure et tête équine sculptés
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-21, -29);
    ctx.bezierCurveTo(-22, -42, -8, -45, 10, -42);
    ctx.quadraticCurveTo(16, -51, 21, -58);
    ctx.lineTo(31, -53);
    ctx.lineTo(30, -47);
    ctx.lineTo(22, -46);
    ctx.quadraticCurveTo(20, -35, 17, -27);
    ctx.bezierCurveTo(12, -20, -14, -20, -21, -29);
    ctx.closePath();

    const zebraGrad = ctx.createLinearGradient(0, -58, 0, -20);
    zebraGrad.addColorStop(0, '#F7EFE0');
    zebraGrad.addColorStop(0.65, '#E4DAC6');
    zebraGrad.addColorStop(1, '#BEB39F');
    ctx.fillStyle = zebraGrad;
    ctx.fill();
    ctx.clip();

    // Rayures noires organiques
    ctx.strokeStyle = '#1E1A17';
    ctx.lineWidth = 2.5;
    const stripeXs = [-18, -13, -8, -3, 2, 7, 12, 16, 20];
    for (let i = 0; i < stripeXs.length; i++) {
        const sx = stripeXs[i];
        ctx.beginPath();
        ctx.moveTo(sx, -57);
        ctx.quadraticCurveTo(sx - 2.6, -38, sx + (i < 3 ? -4 : 1.5), -19);
        ctx.stroke();
    }
    ctx.restore();

    // Oreilles, crinière dressée rayée & museau sombre
    ctx.fillStyle = '#201B18';
    ctx.beginPath();
    ctx.moveTo(19, -57);
    ctx.lineTo(20, -63);
    ctx.lineTo(23, -57);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#201B18';
    ctx.lineWidth = 3.1;
    ctx.beginPath();
    ctx.moveTo(9, -43);
    ctx.lineTo(20, -58);
    ctx.stroke();

    ctx.fillStyle = '#25201C';
    ctx.beginPath();
    ctx.ellipse(30, -50, 3.2, 2.6, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Queue avec touffe
    ctx.strokeStyle = '#241F1B';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-21, -34);
    ctx.quadraticCurveTo(-27, -26, -25, -18);
    ctx.stroke();
}

function drawRhino(ctx) {
    drawAnimalGroundShadow(ctx, 36, 6.8);

    // Pattes arrière sombres
    ctx.fillStyle = '#3E3934';
    ctx.beginPath();
    ctx.moveTo(-21, -22);
    ctx.lineTo(-12, -22);
    ctx.lineTo(-11, -1);
    ctx.lineTo(-19, -1);
    ctx.closePath();
    ctx.moveTo(8, -22);
    ctx.lineTo(17, -22);
    ctx.lineTo(18, -1);
    ctx.lineTo(10, -1);
    ctx.closePath();
    ctx.fill();

    // Corps cuirassé de rhinocéros
    const rhinoGrad = ctx.createLinearGradient(0, -54, 0, -14);
    rhinoGrad.addColorStop(0, '#8A8378');
    rhinoGrad.addColorStop(0.45, '#645E56');
    rhinoGrad.addColorStop(1, '#3D3934');
    ctx.fillStyle = rhinoGrad;
    ctx.beginPath();
    ctx.moveTo(-29, -31);
    ctx.bezierCurveTo(-30, -47, -14, -52, 6, -49);
    ctx.bezierCurveTo(18, -48, 25, -45, 32, -39);
    ctx.lineTo(40, -35);
    ctx.bezierCurveTo(43, -31, 41, -24, 34, -22);
    ctx.bezierCurveTo(22, -18, -18, -16, -29, -31);
    ctx.closePath();
    ctx.fill();

    // Plis de peau cuirassée (épaules & hanches)
    ctx.strokeStyle = 'rgba(34, 30, 26, 0.56)';
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(-9, -49);
    ctx.quadraticCurveTo(-12, -34, -8, -20);
    ctx.moveTo(14, -46);
    ctx.quadraticCurveTo(11, -33, 15, -20);
    ctx.stroke();

    // Reflet chaud de la verrière
    ctx.strokeStyle = 'rgba(246, 218, 166, 0.38)';
    ctx.lineWidth = 1.9;
    ctx.beginPath();
    ctx.moveTo(-22, -45);
    ctx.quadraticCurveTo(2, -52, 22, -44);
    ctx.stroke();

    // Pattes avant trapues
    ctx.fillStyle = '#56514A';
    ctx.beginPath();
    ctx.moveTo(-26, -23);
    ctx.lineTo(-16, -23);
    ctx.lineTo(-16, -1);
    ctx.lineTo(-25, -1);
    ctx.closePath();
    ctx.moveTo(14, -23);
    ctx.lineTo(24, -23);
    ctx.lineTo(25, -1);
    ctx.lineTo(15, -1);
    ctx.closePath();
    ctx.fill();

    // Grande corne avant + petite seconde corne
    ctx.fillStyle = '#DDD0B8';
    ctx.beginPath();
    ctx.moveTo(35, -34);
    ctx.quadraticCurveTo(43, -44, 47, -51);
    ctx.quadraticCurveTo(42, -38, 40, -31);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(29, -37);
    ctx.lineTo(33, -45);
    ctx.lineTo(34, -35);
    ctx.closePath();
    ctx.fill();

    // Oreille & œil
    ctx.fillStyle = '#4A453F';
    ctx.beginPath();
    ctx.ellipse(23, -44, 2.3, 4.4, -0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1B1714';
    ctx.beginPath();
    ctx.arc(31, -33, 1.4, 0, Math.PI * 2);
    ctx.fill();
}

function drawLion(ctx) {
    drawAnimalGroundShadow(ctx, 28, 5.4);

    // Queue souple avec touffe sombre
    ctx.strokeStyle = '#9D713B';
    ctx.lineWidth = 2.1;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-21, -28);
    ctx.bezierCurveTo(-30, -26, -34, -14, -29, -11);
    ctx.stroke();
    ctx.fillStyle = '#4B2B14';
    ctx.beginPath();
    ctx.ellipse(-29, -11, 3.2, 2.2, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Pattes arrière
    ctx.strokeStyle = '#996D37';
    ctx.lineWidth = 4.2;
    ctx.beginPath();
    ctx.moveTo(-13, -19);
    ctx.lineTo(-15, -2);
    ctx.moveTo(9, -19);
    ctx.lineTo(11, -2);
    ctx.stroke();

    // Corps félin musclé
    const lionGrad = ctx.createLinearGradient(0, -39, 0, -14);
    lionGrad.addColorStop(0, '#DDB06A');
    lionGrad.addColorStop(0.55, '#BD8B49');
    lionGrad.addColorStop(1, '#8C622E');
    ctx.fillStyle = lionGrad;
    ctx.beginPath();
    ctx.moveTo(-22, -26);
    ctx.bezierCurveTo(-20, -37, -4, -39, 14, -37);
    ctx.bezierCurveTo(22, -35, 22, -22, 14, -19);
    ctx.bezierCurveTo(2, -16, -16, -16, -22, -26);
    ctx.closePath();
    ctx.fill();

    // Pattes avant avec pattes posées
    ctx.strokeStyle = '#CA9956';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(-17, -19);
    ctx.lineTo(-20, -2);
    ctx.moveTo(13, -19);
    ctx.lineTo(17, -2);
    ctx.stroke();
    ctx.fillStyle = '#C99855';
    ctx.beginPath();
    ctx.ellipse(-19, -1.5, 3.4, 1.8, 0, 0, Math.PI * 2);
    ctx.ellipse(18, -1.5, 3.4, 1.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Crinière majestueuse sculptée en mèches
    const maneGrad = ctx.createRadialGradient(20, -34, 3, 19, -34, 16);
    maneGrad.addColorStop(0, '#A6642D');
    maneGrad.addColorStop(0.62, '#6A3B17');
    maneGrad.addColorStop(1, '#41210C');
    ctx.fillStyle = maneGrad;
    ctx.beginPath();
    ctx.moveTo(12, -45);
    ctx.quadraticCurveTo(20, -49, 27, -44);
    ctx.quadraticCurveTo(33, -38, 30, -28);
    ctx.quadraticCurveTo(26, -18, 17, -19);
    ctx.quadraticCurveTo(8, -21, 7, -32);
    ctx.quadraticCurveTo(6, -42, 12, -45);
    ctx.closePath();
    ctx.fill();

    // Visage, petite oreille ronde & museau noble
    ctx.fillStyle = '#D6A55E';
    ctx.beginPath();
    ctx.arc(21, -41, 2.8, 0, Math.PI * 2);
    ctx.ellipse(25, -34, 7.2, 6.0, 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3A2312';
    ctx.beginPath();
    ctx.arc(31, -33, 1.8, 0, Math.PI * 2);
    ctx.fill();
}

function drawAntelope(ctx) {
    drawAnimalGroundShadow(ctx, 20, 4.4);

    // Pattes élancées
    ctx.strokeStyle = '#8F6A44';
    ctx.lineWidth = 2.3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-10, -22);
    ctx.lineTo(-12, -1);
    ctx.moveTo(8, -22);
    ctx.lineTo(10, -1);
    ctx.stroke();

    ctx.strokeStyle = '#C99D6D';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-14, -22);
    ctx.lineTo(-17, -1);
    ctx.moveTo(11, -22);
    ctx.lineTo(15, -1);
    ctx.stroke();

    // Corps fin d'antilope / oryx
    const antGrad = ctx.createLinearGradient(0, -38, 0, -18);
    antGrad.addColorStop(0, '#CFA270');
    antGrad.addColorStop(0.62, '#B08151');
    antGrad.addColorStop(1, '#EFE2CC');
    ctx.fillStyle = antGrad;
    ctx.beginPath();
    ctx.moveTo(-16, -26);
    ctx.bezierCurveTo(-15, -36, -2, -37, 11, -35);
    ctx.lineTo(19, -49);
    ctx.lineTo(26, -46);
    ctx.lineTo(17, -25);
    ctx.quadraticCurveTo(2, -19, -16, -26);
    ctx.closePath();
    ctx.fill();

    // Bande sombre sur le flanc
    ctx.strokeStyle = '#4A3422';
    ctx.lineWidth = 2.1;
    ctx.beginPath();
    ctx.moveTo(-12, -24);
    ctx.quadraticCurveTo(0, -23, 12, -25);
    ctx.stroke();

    // Longues cornes annelées courbées vers l'arrière
    ctx.strokeStyle = '#332419';
    ctx.lineWidth = 1.9;
    ctx.beginPath();
    ctx.moveTo(20, -49);
    ctx.quadraticCurveTo(14, -64, 4, -68);
    ctx.moveTo(22, -49);
    ctx.quadraticCurveTo(17, -63, 8, -66);
    ctx.stroke();
}

function drawOstrich(ctx) {
    drawAnimalGroundShadow(ctx, 16, 4.2);

    // Longues pattes fines rose-gris avec légère articulation
    ctx.strokeStyle = '#C2A996';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-3, -27);
    ctx.lineTo(-5, -14);
    ctx.lineTo(-6, -1);
    ctx.moveTo(3, -27);
    ctx.lineTo(5, -14);
    ctx.lineTo(7, -1);
    ctx.stroke();

    // Corps dodu de plumes sombres
    ctx.fillStyle = '#2B2420';
    ctx.beginPath();
    ctx.ellipse(0, -36, 15.5, 11.5, -0.1, 0, Math.PI * 2);
    ctx.fill();

    // Panache de plumes crème sur l'aile et la queue
    ctx.fillStyle = '#F2E9D8';
    ctx.beginPath();
    ctx.ellipse(-12, -35, 7, 5, 0.25, 0, Math.PI * 2);
    ctx.ellipse(-4, -32, 8.5, 4.2, -0.05, 0, Math.PI * 2);
    ctx.fill();

    // Long cou fin + petite tête & bec
    ctx.strokeStyle = '#D5BCAA';
    ctx.lineWidth = 3.7;
    ctx.beginPath();
    ctx.moveTo(11, -40);
    ctx.quadraticCurveTo(16, -54, 15, -67);
    ctx.stroke();

    ctx.fillStyle = '#D8C0AE';
    ctx.beginPath();
    ctx.ellipse(17, -68, 4.2, 3.0, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#D99E52';
    ctx.beginPath();
    ctx.moveTo(20, -68);
    ctx.lineTo(26, -66.8);
    ctx.lineTo(20, -65.8);
    ctx.closePath();
    ctx.fill();
}

function drawBuffalo(ctx) {
    drawAnimalGroundShadow(ctx, 27, 5.4);

    // Pattes robustes
    ctx.fillStyle = '#2B211B';
    ctx.beginPath();
    ctx.roundRect(-18, -20, 7.2, 21, 3);
    ctx.roundRect(10, -20, 7.2, 21, 3);
    ctx.roundRect(-13, -19, 6.8, 20, 3);
    ctx.roundRect(5, -19, 6.8, 20, 3);
    ctx.fill();

    // Corps massif de buffle sombre
    const bufGrad = ctx.createLinearGradient(0, -45, 0, -16);
    bufGrad.addColorStop(0, '#5E493A');
    bufGrad.addColorStop(0.5, '#3C2E25');
    bufGrad.addColorStop(1, '#231A15');
    ctx.fillStyle = bufGrad;
    ctx.beginPath();
    ctx.moveTo(-23, -27);
    ctx.bezierCurveTo(-23, -41, -8, -45, 10, -43);
    ctx.bezierCurveTo(22, -41, 28, -32, 26, -22);
    ctx.bezierCurveTo(18, -17, -16, -16, -23, -27);
    ctx.closePath();
    ctx.fill();

    // Tête baissée & larges cornes recourbées
    ctx.fillStyle = '#32261E';
    ctx.beginPath();
    ctx.ellipse(25, -31, 8.5, 7.5, 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#C8B89E';
    ctx.lineWidth = 3.0;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(22, -37);
    ctx.quadraticCurveTo(30, -47, 36, -41);
    ctx.stroke();
}

function drawGalleryBird(ctx, elapsed, phase, facing) {
    const glideBob = Math.sin(elapsed * 1.45 + phase) * 2.8;
    const wingFlex = Math.sin(elapsed * 1.9 + phase) * 3.2;

    ctx.save();
    ctx.translate(0, glideBob);
    ctx.scale(facing, 1);

    // Corps fin d'oiseau en vol naturalisé sous la verrière
    ctx.fillStyle = '#E8DCC6';
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 3.2, -0.08, 0, Math.PI * 2);
    ctx.fill();

    // Aile arrière
    ctx.fillStyle = 'rgba(196, 174, 144, 0.85)';
    ctx.beginPath();
    ctx.moveTo(-2, -1);
    ctx.quadraticCurveTo(-14, -14 - wingFlex * 0.5, -24, -6 - wingFlex);
    ctx.quadraticCurveTo(-10, -3, -2, 1);
    ctx.closePath();
    ctx.fill();

    // Aile avant éclairée par la verrière
    const wingGrad = ctx.createLinearGradient(0, -14, 0, 6);
    wingGrad.addColorStop(0, '#FFF4DC');
    wingGrad.addColorStop(0.55, '#D8C4A4');
    wingGrad.addColorStop(1, '#7D664E');
    ctx.fillStyle = wingGrad;
    ctx.beginPath();
    ctx.moveTo(2, -1);
    ctx.quadraticCurveTo(-4, -17 + wingFlex * 0.4, -18, -11 + wingFlex);
    ctx.quadraticCurveTo(-5, 1, 2, 2);
    ctx.closePath();
    ctx.fill();

    // Bec fin
    ctx.strokeStyle = '#C88D48';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(9, -1);
    ctx.lineTo(14.5, -0.5);
    ctx.stroke();

    ctx.restore();
}

function drawSpecies(ctx, species, elapsed, phase, facing) {
    switch (species) {
        case 'elephant':
            drawElephant(ctx);
            break;
        case 'giraffe':
            drawGiraffe(ctx);
            break;
        case 'zebra':
            drawZebra(ctx);
            break;
        case 'rhino':
            drawRhino(ctx);
            break;
        case 'lion':
            drawLion(ctx);
            break;
        case 'antelope':
            drawAntelope(ctx);
            break;
        case 'ostrich':
            drawOstrich(ctx);
            break;
        case 'buffalo':
            drawBuffalo(ctx);
            break;
        case 'bird':
            drawGalleryBird(ctx, elapsed, phase, facing);
            break;
        default:
            break;
    }
}

export function drawCaravanAnimals(ctx, width, height, frame, elapsed) {
    const { horizonY, floorSpan, centerX, isNarrow } = getMuseumLayout(width, height);
    const { parallax, doors, bgFade } = frame;

    const unitScale = clamp(Math.min(width, height) / 480, 0.72, 1.32);
    const depthOrder = ['far', 'mid', 'fg'];

    for (let d = 0; d < depthOrder.length; d++) {
        const depth = depthOrder[d];
        const pLayer = parallax[depth];
        const layerBaseAlpha = depth === 'far' ? 0.84 : (depth === 'mid' ? 0.96 : 1.0);

        for (let i = 0; i < MUSEUM_CARAVAN_SPECIES.length; i++) {
            const animal = MUSEUM_CARAVAN_SPECIES[i];
            if (animal.depth !== depth) continue;

            const isBird = animal.species === 'bird';
            const fadeFactor = isBird
                ? bgFade
                : doors.doorOpacity;
            if (fadeFactor <= 0.01) continue;

            // Légère marge intérieure sur mobile portrait pour éviter toute coupure aux bords
            const nxSpread = isNarrow
                ? 0.5 + (animal.nx - 0.5) * 0.96
                : animal.nx;

            const baseX = clamp(nxSpread, 0.08, 0.92) * width;
            const offsetFromCenter = baseX - centerX;
            const parallaxX = offsetFromCenter * pLayer.lateralFactor;

            // Lors de l'ouverture des grandes portes, les animaux de gauche glissent à gauche et ceux de droite à droite
            const doorPartSlide = animal.side * doors.slideOffset * (depth === 'fg' ? 1.15 : (depth === 'mid' ? 0.96 : 0.72));
            const ax = baseX + parallaxX + doorPartSlide + (isBird ? Math.sin(elapsed * 0.55 + animal.phase) * 7 : 0);

            let ay;
            if (isBird) {
                ay = animal.ny * height + pLayer.y * 0.55;
            } else {
                ay = horizonY + animal.ny * floorSpan + (depth === 'fg' ? pLayer.y : -pLayer.y * 0.25);
            }

            const finalScale = animal.scale * unitScale * pLayer.scale * (isNarrow ? 0.78 : 1.02);

            ctx.save();
            ctx.globalAlpha = layerBaseAlpha * fadeFactor;
            ctx.translate(ax, ay);
            if (!isBird) {
                ctx.scale(finalScale * animal.facing, finalScale);
            } else {
                ctx.scale(finalScale, finalScale);
            }
            drawSpecies(ctx, animal.species, elapsed, animal.phase, animal.facing);
            ctx.restore();
        }
    }
}

/* -------------------------------------------------------------------------
   6. OMBRES AU SOL & REFLETS DISCRETS D'ALEXIS & CLARA SUR LE PARQUET
   ------------------------------------------------------------------------- */
export function drawCoupleParquetReflections(ctx, alexisX, claraX, coupleY, perspScale, glowRise, alpha) {
    if (alpha <= 0.01) return;

    ctx.save();
    // Ombre douce projetée légèrement vers le bas depuis les portes lumineuses
    const shadowStretch = 1 + glowRise * 0.45;
    ctx.fillStyle = `rgba(18, 10, 6, ${(0.24 * alpha).toFixed(3)})`;

    ctx.beginPath();
    ctx.ellipse(alexisX, coupleY + 30 * perspScale, 14 * perspScale, 5.2 * perspScale * shadowStretch, 0, 0, Math.PI * 2);
    ctx.ellipse(claraX, coupleY + 31.5 * perspScale, 13 * perspScale, 5.0 * perspScale * shadowStretch, 0, 0, Math.PI * 2);
    ctx.fill();

    // Reflet chaud très subtil des silhouettes sur le parquet ciré
    const reflGradA = ctx.createLinearGradient(0, coupleY + 28 * perspScale, 0, coupleY + 56 * perspScale);
    reflGradA.addColorStop(0, `rgba(24, 38, 32, ${(0.18 * alpha).toFixed(3)})`);
    reflGradA.addColorStop(1, 'rgba(24, 38, 32, 0)');
    ctx.fillStyle = reflGradA;
    ctx.beginPath();
    ctx.ellipse(alexisX, coupleY + 41 * perspScale, 10 * perspScale, 14 * perspScale, 0, 0, Math.PI * 2);
    ctx.fill();

    const reflGradC = ctx.createLinearGradient(0, coupleY + 29 * perspScale, 0, coupleY + 57 * perspScale);
    reflGradC.addColorStop(0, `rgba(248, 224, 152, ${(0.18 * alpha).toFixed(3)})`);
    reflGradC.addColorStop(1, 'rgba(248, 224, 152, 0)');
    ctx.fillStyle = reflGradC;
    ctx.beginPath();
    ctx.ellipse(claraX, coupleY + 42 * perspScale, 9.5 * perspScale, 13.5 * perspScale, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

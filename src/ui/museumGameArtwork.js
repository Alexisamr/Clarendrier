/**
 * ============================================================================
 * DÉCORS 2D VUE DE CÔTÉ — GRANDE GALERIE DE L'ÉVOLUTION (CASE 22)
 * ============================================================================
 * Même principe haute-performance que l'animation du Muséum :
 *  - Couches architecturales répétables pré-rendues une seule fois au montage /
 *    redimensionnement sur des tuiles hors-écran (verrière, 2 étages de balcons
 *    décoratifs en fer ouvragé, coursive parquet + balustrade + colonnes,
 *    poutrelle avant) -> 60 FPS fluides même sur téléphone !
 *  - Grand hall central avec le cortège d'animaux naturalisés en parallaxe
 *  - Rayons de lumière tamisée & particules de poussière flottantes
 *  - Cartels / panneaux consultables avec halo doré de proximité
 *  - Mini-carte circulaire du musée
 * ============================================================================
 */

import { shortestLoopDelta, wrapLoopPosition } from '../logic/museumGameLogic.js';

export function getMuseumGameLayout(width, height) {
    const isNarrow = width < 640;
    const verriereBottomY = Math.round(height * 0.23);
    const upperBalconyY = Math.round(height * 0.355);
    const lowerBalconyY = Math.round(height * 0.485);
    const hallFloorTopY = Math.round(height * 0.555);
    const hallFloorMidY = Math.round(height * 0.655);
    const railingTopY = Math.round(height * 0.72);
    const walkwayFloorY = Math.round(height * 0.865);
    const girderTopY = Math.round(height * 0.935);
    const avatarScale = isNarrow ? 0.94 : Math.min(1.16, Math.max(0.96, height / 760));

    return {
        isNarrow,
        verriereBottomY,
        upperBalconyY,
        lowerBalconyY,
        hallFloorTopY,
        hallFloorMidY,
        railingTopY,
        walkwayFloorY,
        girderTopY,
        avatarScale
    };
}

function makeOffscreen(w, h, dpr) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w * dpr));
    c.height = Math.max(1, Math.round(h * dpr));
    const ctx = c.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { canvas: c, ctx, width: w, height: h };
}

/* -------------------------------------------------------------------------
   1. CACHE DE TUILES ARCHITECTURALES PRÉ-RENDUES (ZERO RECALCUL PAR FRAME)
   ------------------------------------------------------------------------- */
export function buildMuseumLayerCache(width, height, dpr, targetCtx) {
    const layout = getMuseumGameLayout(width, height);
    const {
        verriereBottomY,
        upperBalconyY,
        lowerBalconyY,
        hallFloorTopY,
        railingTopY,
        walkwayFloorY,
        girderTopY
    } = layout;

    // A. Fond statique pleine largeur (verrière lumineuse + mur profond + sol du hall)
    const backdrop = makeOffscreen(width, height, dpr);
    {
        const ctx = backdrop.ctx;
        const wallGrad = ctx.createLinearGradient(0, 0, 0, hallFloorTopY);
        wallGrad.addColorStop(0, '#3C2D1F');
        wallGrad.addColorStop(0.28, '#2A1F16');
        wallGrad.addColorStop(0.7, '#1E1610');
        wallGrad.addColorStop(1, '#16100C');
        ctx.fillStyle = wallGrad;
        ctx.fillRect(0, 0, width, hallFloorTopY + 6);

        const glassGrad = ctx.createLinearGradient(0, 0, 0, verriereBottomY * 1.15);
        glassGrad.addColorStop(0, '#FBF1D6');
        glassGrad.addColorStop(0.45, '#E9C88D');
        glassGrad.addColorStop(0.82, '#9A7243');
        glassGrad.addColorStop(1, 'rgba(42, 30, 21, 0)');
        ctx.fillStyle = glassGrad;
        ctx.fillRect(0, 0, width, verriereBottomY * 1.15);

        const domeGlow = ctx.createRadialGradient(
            width * 0.5,
            verriereBottomY * 0.25,
            12,
            width * 0.5,
            verriereBottomY * 0.55,
            Math.max(width * 0.62, height * 0.45)
        );
        domeGlow.addColorStop(0, 'rgba(255, 248, 224, 0.52)');
        domeGlow.addColorStop(0.45, 'rgba(238, 194, 122, 0.18)');
        domeGlow.addColorStop(1, 'rgba(238, 194, 122, 0)');
        ctx.fillStyle = domeGlow;
        ctx.fillRect(0, 0, width, hallFloorTopY);

        const hallGrad = ctx.createLinearGradient(0, hallFloorTopY, 0, walkwayFloorY);
        hallGrad.addColorStop(0, '#3C291A');
        hallGrad.addColorStop(0.32, '#513722');
        hallGrad.addColorStop(0.75, '#462E1C');
        hallGrad.addColorStop(1, '#2C1C11');
        ctx.fillStyle = hallGrad;
        ctx.fillRect(0, hallFloorTopY, width, walkwayFloorY - hallFloorTopY + 4);

        const hallSheen = ctx.createRadialGradient(
            width * 0.5,
            hallFloorTopY + (walkwayFloorY - hallFloorTopY) * 0.38,
            20,
            width * 0.5,
            hallFloorTopY + (walkwayFloorY - hallFloorTopY) * 0.45,
            width * 0.62
        );
        hallSheen.addColorStop(0, 'rgba(252, 218, 152, 0.24)');
        hallSheen.addColorStop(0.6, 'rgba(210, 158, 92, 0.08)');
        hallSheen.addColorStop(1, 'rgba(210, 158, 92, 0)');
        ctx.fillStyle = hallSheen;
        ctx.fillRect(0, hallFloorTopY, width, walkwayFloorY - hallFloorTopY);
    }

    // B. Tuile Verrière Vitrée & Arches Métalliques XIXe (148px répétable)
    const verriereBayW = 148;
    const verriereTileH = Math.max(40, verriereBottomY + 12);
    const verriereTile = makeOffscreen(verriereBayW, verriereTileH, dpr);
    {
        const ctx = verriereTile.ctx;
        const corniceY = verriereBottomY * 0.92;
        const paneRows = [
            verriereBottomY * 0.18,
            verriereBottomY * 0.38,
            verriereBottomY * 0.62
        ];

        // Légers reflets de verre dépoli sur les carreaux supérieurs de la verrière
        ctx.fillStyle = 'rgba(255, 250, 238, 0.13)';
        ctx.fillRect(6, 4, verriereBayW * 0.5 - 10, paneRows[0] - 8);
        ctx.fillRect(verriereBayW * 0.5 + 4, 4, verriereBayW * 0.5 - 10, paneRows[0] - 8);
        ctx.fillStyle = 'rgba(255, 248, 230, 0.08)';
        ctx.fillRect(6, paneRows[0] + 4, verriereBayW * 0.5 - 10, paneRows[1] - paneRows[0] - 8);
        ctx.fillRect(verriereBayW * 0.5 + 4, paneRows[0] + 4, verriereBayW * 0.5 - 10, paneRows[1] - paneRows[0] - 8);

        // Fines traverses horizontales & meneaux verticaux de la verrière en fer XIXe
        ctx.strokeStyle = 'rgba(46, 35, 26, 0.44)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        for (let r = 0; r < paneRows.length; r++) {
            ctx.moveTo(0, paneRows[r]);
            ctx.lineTo(verriereBayW, paneRows[r]);
        }
        // Meneaux verticaux (chaque travée divisée en 4 panneaux vitrés)
        for (let m = 1; m <= 3; m++) {
            const mx = (verriereBayW * m) / 4;
            ctx.moveTo(mx, 0);
            ctx.lineTo(mx, corniceY);
        }
        ctx.stroke();

        // Montants principaux entre chaque travée vitrée
        ctx.strokeStyle = 'rgba(38, 28, 21, 0.72)';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, corniceY);
        ctx.moveTo(verriereBayW * 0.5, 0);
        ctx.lineTo(verriereBayW * 0.5, corniceY);
        ctx.stroke();

        // Liseré doré subtil sur les traverses de la verrière
        ctx.strokeStyle = 'rgba(244, 212, 152, 0.24)';
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(0, paneRows[0] + 1.4);
        ctx.lineTo(verriereBayW, paneRows[0] + 1.4);
        ctx.moveTo(0, paneRows[1] + 1.4);
        ctx.lineTo(verriereBayW, paneRows[1] + 1.4);
        ctx.stroke();

        // Grandes arches cintrées métalliques de la nef
        ctx.strokeStyle = '#2B221B';
        ctx.lineWidth = 3.8;
        ctx.beginPath();
        ctx.moveTo(0, verriereBottomY * 0.94);
        ctx.quadraticCurveTo(verriereBayW * 0.5, verriereBottomY * 0.14, verriereBayW, verriereBottomY * 0.94);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(216, 174, 112, 0.34)';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(4, verriereBottomY * 0.94);
        ctx.quadraticCurveTo(verriereBayW * 0.5, verriereBottomY * 0.2, verriereBayW - 4, verriereBottomY * 0.94);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(42, 32, 24, 0.62)';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.arc(verriereBayW * 0.5, verriereBottomY * 0.42, 5.2, 0, Math.PI * 2);
        ctx.stroke();

        // Corniche métallique en bas de la verrière
        ctx.fillStyle = '#231A14';
        ctx.fillRect(0, corniceY, verriereBayW, 7);
        ctx.fillStyle = 'rgba(220, 180, 118, 0.36)';
        ctx.fillRect(0, corniceY, verriereBayW, 1.4);
    }

    // C. Tuile Étages Décoratifs de Balcons & Coursives en face (196px répétable)
    const balconyBayW = 196;
    const balconyTopY = Math.floor(verriereBottomY * 0.92);
    const balconyTileH = Math.max(80, hallFloorTopY - balconyTopY + 4);
    const balconyTile = makeOffscreen(balconyBayW, balconyTileH, dpr);
    {
        const ctx = balconyTile.ctx;
        const relUpperY = upperBalconyY - balconyTopY;
        const relLowerY = lowerBalconyY - balconyTopY;
        const relFloorY = hallFloorTopY - balconyTopY;
        const archX = balconyBayW * 0.5;
        const archW = balconyBayW * 0.64;

        // Niches cintrées des 2 étages supérieurs + arcade rez-de-chaussée
        ctx.fillStyle = 'rgba(16, 11, 8, 0.44)';
        ctx.beginPath();
        ctx.moveTo(archX - archW * 0.5, relUpperY);
        ctx.lineTo(archX - archW * 0.5, 28);
        ctx.arc(archX, 28, archW * 0.5, Math.PI, 0);
        ctx.lineTo(archX + archW * 0.5, relUpperY);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = 'rgba(14, 10, 7, 0.52)';
        ctx.beginPath();
        ctx.moveTo(archX - archW * 0.5, relLowerY);
        ctx.lineTo(archX - archW * 0.5, relUpperY + 22);
        ctx.arc(archX, relUpperY + 22, archW * 0.5, Math.PI, 0);
        ctx.lineTo(archX + archW * 0.5, relLowerY);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = 'rgba(12, 8, 6, 0.58)';
        ctx.fillRect(archX - archW * 0.48, relLowerY + 6, archW * 0.96, relFloorY - relLowerY - 6);

        // Colonne fine en fonte XIXe sur le bord gauche de la tuile
        const colW = 7;
        const colGrad = ctx.createLinearGradient(0, 0, colW, 0);
        colGrad.addColorStop(0, '#1B1511');
        colGrad.addColorStop(0.5, '#594635');
        colGrad.addColorStop(1, '#1A130F');
        ctx.fillStyle = colGrad;
        ctx.fillRect(0, 0, colW, relFloorY);

        ctx.fillStyle = '#6C553E';
        ctx.fillRect(0, 0, colW * 1.4, 5);

        // 2 étages de balcons en fer ouvragé
        const tiers = [
            { y: relUpperY, railH: Math.max(18, height * 0.036) },
            { y: relLowerY, railH: Math.max(20, height * 0.04) }
        ];
        for (let t = 0; t < tiers.length; t++) {
            const tier = tiers[t];
            ctx.fillStyle = '#251C16';
            ctx.fillRect(0, tier.y, balconyBayW, 7);
            ctx.fillStyle = 'rgba(216, 174, 114, 0.36)';
            ctx.fillRect(0, tier.y, balconyBayW, 1.3);

            ctx.strokeStyle = '#6A523B';
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.moveTo(0, tier.y - tier.railH);
            ctx.lineTo(balconyBayW, tier.y - tier.railH);
            ctx.stroke();

            const barStep = 14;
            ctx.strokeStyle = 'rgba(52, 40, 31, 0.88)';
            ctx.lineWidth = 1.05;
            ctx.beginPath();
            for (let bx = 0; bx <= balconyBayW; bx += barStep) {
                ctx.moveTo(bx, tier.y);
                ctx.lineTo(bx, tier.y - tier.railH);
            }
            ctx.stroke();

            ctx.strokeStyle = 'rgba(154, 118, 76, 0.42)';
            ctx.lineWidth = 0.9;
            ctx.beginPath();
            for (let bx = 0; bx < balconyBayW; bx += barStep * 2) {
                const mx = bx + barStep * 0.5;
                const my = tier.y - tier.railH * 0.5;
                ctx.moveTo(mx + 4.5, my);
                ctx.ellipse(mx, my, 4.5, tier.railH * 0.32, 0, 0, Math.PI * 2);
            }
            ctx.stroke();

            // Applique dorée chaleureuse au centre de chaque travée
            const ly = tier.y - tier.railH - 14;
            const glow = ctx.createRadialGradient(archX, ly, 1, archX, ly, 18);
            glow.addColorStop(0, 'rgba(255, 232, 168, 0.58)');
            glow.addColorStop(0.5, 'rgba(228, 168, 86, 0.18)');
            glow.addColorStop(1, 'rgba(228, 168, 86, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(archX, ly, 18, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#FFF3CA';
            ctx.beginPath();
            ctx.arc(archX, ly, 2.0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.strokeStyle = 'rgba(20, 14, 10, 0.65)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, relFloorY);
        ctx.lineTo(balconyBayW, relFloorY);
        ctx.stroke();
    }

    // D. Tuile Coursive Jouable compacte (de la balustrade au parquet uniquement — zéro surdessin transparent)
    const coursiveBayW = 540;
    const floorTopY = walkwayFloorY - 26;
    const coursiveTopY = Math.max(0, railingTopY - 10);
    const coursiveTileH = Math.max(40, girderTopY - coursiveTopY + 2);
    const coursiveTile = makeOffscreen(coursiveBayW, coursiveTileH, dpr);
    {
        const ctx = coursiveTile.ctx;
        const relRailY = railingTopY - coursiveTopY;
        const relFloorTopY = floorTopY - coursiveTopY;
        const relGirderTopY = girderTopY - coursiveTopY;

        // Balustrade fer forgé
        ctx.fillStyle = '#231A14';
        ctx.fillRect(0, relFloorTopY - 6, coursiveBayW, 8);

        ctx.fillStyle = '#4B3220';
        ctx.fillRect(0, relRailY - 4, coursiveBayW, 6);
        ctx.fillStyle = 'rgba(232, 192, 128, 0.45)';
        ctx.fillRect(0, relRailY - 4, coursiveBayW, 1.4);

        const railStep = 25;
        ctx.strokeStyle = '#2B211A';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        for (let rx = 0; rx < coursiveBayW; rx += railStep) {
            ctx.moveTo(rx, relRailY + 2);
            ctx.lineTo(rx, relFloorTopY - 5);
        }
        ctx.stroke();

        const railH = Math.max(18, relFloorTopY - relRailY - 8);
        ctx.strokeStyle = 'rgba(156, 120, 76, 0.55)';
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        for (let rx = 0; rx < coursiveBayW; rx += railStep * 2) {
            const mx = rx + railStep * 0.5;
            const my = relRailY + 3 + railH * 0.5;
            ctx.moveTo(mx + 7.2, my);
            ctx.ellipse(mx, my, 7.2, railH * 0.34, 0, 0, Math.PI * 2);
        }
        ctx.stroke();

        // Parquet chêne ciré de la coursive jouable
        const floorGrad = ctx.createLinearGradient(0, relFloorTopY, 0, relGirderTopY);
        floorGrad.addColorStop(0, '#6C4A2E');
        floorGrad.addColorStop(0.35, '#7A5536');
        floorGrad.addColorStop(0.85, '#593B23');
        floorGrad.addColorStop(1, '#3E2716');
        ctx.fillStyle = floorGrad;
        ctx.fillRect(0, relFloorTopY, coursiveBayW, relGirderTopY - relFloorTopY + 2);

        ctx.fillStyle = 'rgba(252, 220, 162, 0.24)';
        ctx.fillRect(0, relFloorTopY, coursiveBayW, 2);

        ctx.strokeStyle = 'rgba(32, 18, 10, 0.34)';
        ctx.lineWidth = 1.1;
        const floorH = relGirderTopY - relFloorTopY;
        ctx.beginPath();
        for (let r = 1; r <= 3; r++) {
            const ry = relFloorTopY + (r / 4) * floorH;
            ctx.moveTo(0, ry);
            ctx.lineTo(coursiveBayW, ry);
        }
        const boardW = 80;
        for (let bx = 0; bx <= coursiveBayW; bx += boardW) {
            ctx.moveTo(bx, relFloorTopY);
            ctx.lineTo(bx - 16, relGirderTopY);
        }
        ctx.stroke();
    }

    // D2. Petit sprite pré-rendu de lanterne dorée (64x64) pour les colonnes en fonte
    const lanternSprite = makeOffscreen(64, 64, dpr);
    {
        const ctx = lanternSprite.ctx;
        const lampHalo = ctx.createRadialGradient(32, 32, 1.5, 32, 32, 30);
        lampHalo.addColorStop(0, 'rgba(255, 240, 188, 0.72)');
        lampHalo.addColorStop(0.45, 'rgba(232, 174, 92, 0.22)');
        lampHalo.addColorStop(1, 'rgba(232, 174, 92, 0)');
        ctx.fillStyle = lampHalo;
        ctx.beginPath();
        ctx.arc(32, 32, 30, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFF5D0';
        ctx.beginPath();
        ctx.arc(32, 32, 3.5, 0, Math.PI * 2);
        ctx.fill();
    }

    // D3. Sprite doux d'aura lumineuse pour le cartel à portée (120x120)
    const cartelGlowSprite = makeOffscreen(120, 120, dpr);
    {
        const ctx = cartelGlowSprite.ctx;
        const halo = ctx.createRadialGradient(60, 60, 6, 60, 60, 56);
        halo.addColorStop(0, 'rgba(255, 232, 168, 0.56)');
        halo.addColorStop(0.55, 'rgba(238, 194, 114, 0.22)');
        halo.addColorStop(1, 'rgba(238, 194, 114, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(60, 60, 56, 0, Math.PI * 2);
        ctx.fill();
    }

    // E. Tuile Poutrelle Avant (192px répétable, parallaxe 1.18x)
    const girderW = 192;
    const girderH = Math.max(24, height - girderTopY + 2);
    const girderTile = makeOffscreen(girderW, girderH, dpr);
    {
        const ctx = girderTile.ctx;
        const g = ctx.createLinearGradient(0, 0, 0, girderH);
        g.addColorStop(0, '#2A1F18');
        g.addColorStop(0.2, '#1A130E');
        g.addColorStop(1, '#110C09');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, girderW, girderH);

        ctx.fillStyle = 'rgba(206, 166, 108, 0.35)';
        ctx.fillRect(0, 0, girderW, 1.5);

        ctx.fillStyle = 'rgba(130, 102, 72, 0.34)';
        for (let x = 24; x < girderW; x += 48) {
            ctx.beginPath();
            ctx.arc(x, Math.min(12, girderH * 0.38), 2.1, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // F. Dégradé unique réutilisable pour les rayons de lumière chaude (zero allocation par frame)
    const gradCtx = targetCtx || backdrop.ctx;
    const beamGrad = gradCtx.createLinearGradient(0, 0, 0, height * 0.86);
    beamGrad.addColorStop(0, 'rgba(255, 244, 210, 0.16)');
    beamGrad.addColorStop(0.5, 'rgba(244, 202, 130, 0.08)');
    beamGrad.addColorStop(1, 'rgba(220, 166, 94, 0)');

    return {
        layout,
        backdrop,
        verriereTile,
        balconyTile,
        balconyTopY,
        coursiveTile,
        coursiveTopY,
        coursiveBayW,
        lanternSprite,
        cartelGlowSprite,
        girderTile,
        beamGrad
    };
}

function drawTiledHorizontally(ctx, tile, scrollX, destY, viewportW) {
    const tw = tile.width;
    const offset = wrapLoopPosition(scrollX, tw);
    for (let x = -offset; x < viewportW + tw; x += tw) {
        ctx.drawImage(tile.canvas, Math.floor(x), destY, tw, tile.height);
    }
}

/* -------------------------------------------------------------------------
   2. COUCHE VERRIÈRE & OISEAUX EN HAUTEUR (PARALLAXE 0.16x)
   ------------------------------------------------------------------------- */
export function drawVerriereTrussesAndBirds(ctx, width, height, cameraX, elapsed, cache) {
    drawTiledHorizontally(ctx, cache.verriereTile, cameraX * 0.16, 0, width);

    const { verriereBottomY } = cache.layout;
    const birdSpacing = 290;
    const cycleW = birdSpacing * 4;
    const birdScroll = wrapLoopPosition(cameraX * 0.24 - elapsed * 9, cycleW);

    ctx.fillStyle = 'rgba(246, 236, 214, 0.82)';
    for (let i = 0; i < 6; i++) {
        const bx = wrapLoopPosition(i * birdSpacing - birdScroll, cycleW) - 80;
        if (bx < -50 || bx > width + 50) continue;
        const by = verriereBottomY * (0.44 + (i % 3) * 0.18) + Math.sin(elapsed * 1.4 + i * 1.7) * 4;
        const flap = Math.sin(elapsed * 2.1 + i * 1.9) * 3.5;
        const s = 0.82 + (i % 2) * 0.18;

        ctx.save();
        ctx.translate(bx, by);
        ctx.scale(s, s);
        ctx.beginPath();
        ctx.moveTo(-18, -2 + flap);
        ctx.quadraticCurveTo(-7, -11 - flap * 0.5, 0, -2);
        ctx.quadraticCurveTo(8, -12 - flap * 0.4, 20, -4 + flap);
        ctx.quadraticCurveTo(8, -1, 0, 2);
        ctx.quadraticCurveTo(-7, 1, -18, -2 + flap);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

/* -------------------------------------------------------------------------
   2B. LUMIÈRE DES LEDS CACHÉES DIFFUSÉE À TRAVERS LA VERRIÈRE (SANS LED VISIBLE)
   ------------------------------------------------------------------------- */
export function drawCeilingRainbowLeds(ctx, width, height, cameraX, elapsed, ledColor, cache) {
    if (!ledColor) return;
    const { r, g, b } = ledColor;
    const { verriereBottomY, hallFloorTopY, walkwayFloorY } = cache.layout;
    const breathe = 0.94 + 0.06 * Math.sin(elapsed * 0.8);
    const corniceY = Math.floor(verriereBottomY * 0.92);

    // Dégradés 1D mis en cache tant que la couleur RGB ne change pas (0 allocation pendant les 17s fixes)
    const washKey = `${r},${g},${b}`;
    if (cache._ledWashKey !== washKey) {
        cache._ledWashKey = washKey;

        // 1. Rétro-éclairage diffus dans le verre dépoli de la verrière (mélange harmonieux avec l'or)
        const gGlass = ctx.createLinearGradient(0, 0, 0, corniceY + 6);
        gGlass.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.42)`);
        gGlass.addColorStop(0.45, `rgba(${r}, ${g}, ${b}, 0.24)`);
        gGlass.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.08)`);
        cache._ledGlassGrad = gGlass;

        // 2. Lavis ambiant très doux qui descend dans la nef en préservant le doré chaleureux
        const gWash = ctx.createLinearGradient(0, corniceY, 0, walkwayFloorY);
        gWash.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.16)`);
        gWash.addColorStop(Math.min(0.65, (hallFloorTopY - corniceY) / Math.max(1, walkwayFloorY - corniceY)), `rgba(${r}, ${g}, ${b}, 0.06)`);
        gWash.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.015)`);
        cache._ledWashGrad = gWash;
    }

    ctx.save();
    ctx.globalAlpha = breathe;

    // Halo coloré diffus derrière les vitres de la verrière (aucun boîtier LED visible)
    ctx.fillStyle = cache._ledGlassGrad;
    ctx.fillRect(0, 0, width, corniceY + 6);

    // Douce variation lumineuse entre les travées vitrées de la verrière (effet verre rétro-éclairé)
    const bayW = cache.verriereTile.width; // 148px
    const offset = wrapLoopPosition(cameraX * 0.16, bayW);
    const paneH = Math.max(16, Math.round(verriereBottomY * 0.36));
    const coreR = Math.round(r + (255 - r) * 0.42);
    const coreG = Math.round(g + (255 - g) * 0.42);
    const coreB = Math.round(b + (255 - b) * 0.42);

    ctx.fillStyle = `rgba(${coreR}, ${coreG}, ${coreB}, 0.16)`;
    for (let x = -offset; x < width + bayW; x += bayW) {
        const bx = Math.floor(x + 8);
        ctx.fillRect(bx, 4, bayW - 16, paneH);
    }

    // Retombée lumineuse très douce sous la verrière sur les balcons et la nef
    ctx.fillStyle = cache._ledWashGrad;
    ctx.fillRect(0, corniceY, width, walkwayFloorY - corniceY);

    ctx.restore();
}

/* -------------------------------------------------------------------------
   3. ÉTAGES DÉCORATIFS DE BALCONS EN FACE (PARALLAXE 0.30x)
   ------------------------------------------------------------------------- */
export function drawOppositeDecorativeBalconies(ctx, width, cameraX, cache) {
    drawTiledHorizontally(ctx, cache.balconyTile, cameraX * 0.30, cache.balconyTopY, width);
}

/* -------------------------------------------------------------------------
   4. ANIMAUX NATURALISÉS DU GRAND HALL CENTRAL (PARALLAXE 0.44x & 0.58x)
   ------------------------------------------------------------------------- */
function drawAnimalShadow(ctx, rx, ry) {
    ctx.fillStyle = 'rgba(16, 10, 6, 0.36)';
    ctx.beginPath();
    ctx.ellipse(0, 1.5, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
}

function drawHallElephant(ctx) {
    drawAnimalShadow(ctx, 42, 7.2);
    ctx.fillStyle = '#3B3631';
    ctx.fillRect(-23, -27, 9, 26);
    ctx.fillRect(10, -27, 9, 26);

    ctx.fillStyle = '#6D655C';
    ctx.beginPath();
    ctx.moveTo(-34, -42);
    ctx.bezierCurveTo(-35, -60, -18, -66, -5, -64);
    ctx.bezierCurveTo(8, -62, 19, -70, 30, -60);
    ctx.bezierCurveTo(36, -53, 35, -40, 32, -32);
    ctx.bezierCurveTo(25, -21, -22, -20, -34, -42);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(248, 218, 164, 0.36)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-26, -57);
    ctx.quadraticCurveTo(-4, -65, 22, -62);
    ctx.stroke();

    ctx.fillStyle = '#5D554D';
    ctx.fillRect(-29, -32, 10, 31);
    ctx.fillRect(16, -32, 10, 31);

    ctx.fillStyle = '#756C62';
    ctx.beginPath();
    ctx.ellipse(34, -53, 13, 14, -0.06, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#605850';
    ctx.lineWidth = 6.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(43, -48);
    ctx.bezierCurveTo(50, -34, 47, -18, 54, -14);
    ctx.stroke();

    ctx.fillStyle = '#504942';
    ctx.beginPath();
    ctx.moveTo(28, -64);
    ctx.bezierCurveTo(10, -68, 4, -50, 11, -38);
    ctx.bezierCurveTo(19, -31, 29, -38, 30, -50);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#F5E9CE';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(39, -42);
    ctx.quadraticCurveTo(52, -37, 59, -45);
    ctx.stroke();
}

function drawHallGiraffe(ctx) {
    drawAnimalShadow(ctx, 24, 5.2);
    ctx.strokeStyle = '#9A6F38';
    ctx.lineWidth = 3.0;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-12, -39);
    ctx.lineTo(-14, -2);
    ctx.moveTo(10, -43);
    ctx.lineTo(12, -2);
    ctx.stroke();

    ctx.strokeStyle = '#CE9C55';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(-16, -39);
    ctx.lineTo(-18, -2);
    ctx.moveTo(14, -43);
    ctx.lineTo(17, -2);
    ctx.stroke();

    ctx.fillStyle = '#CFA056';
    ctx.beginPath();
    ctx.moveTo(-19, -41);
    ctx.quadraticCurveTo(-14, -55, 8, -59);
    ctx.lineTo(24, -104);
    ctx.lineTo(30, -102);
    ctx.lineTo(19, -53);
    ctx.quadraticCurveTo(15, -38, -12, -36);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#DCA95C';
    ctx.beginPath();
    ctx.ellipse(30, -104, 7.5, 3.8, 0.16, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#6A4120';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(25, -108);
    ctx.lineTo(24, -114);
    ctx.moveTo(28, -108);
    ctx.lineTo(28, -114);
    ctx.stroke();

    const spots = [[-11, -45], [-2, -49], [6, -44], [12, -52], [16, -64], [19, -74], [22, -84], [25, -93]];
    ctx.fillStyle = '#6E401D';
    ctx.beginPath();
    for (let i = 0; i < spots.length; i++) {
        ctx.moveTo(spots[i][0] + 3.1, spots[i][1]);
        ctx.ellipse(spots[i][0], spots[i][1], 3.1, 2.4, 0.2, 0, Math.PI * 2);
    }
    ctx.fill();
}

function drawHallZebra(ctx) {
    drawAnimalShadow(ctx, 24, 5.0);
    ctx.strokeStyle = '#C6BBA8';
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-12, -23);
    ctx.lineTo(-14, -2);
    ctx.moveTo(10, -23);
    ctx.lineTo(12, -2);
    ctx.stroke();

    ctx.strokeStyle = '#F2E9D8';
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.moveTo(-16, -23);
    ctx.lineTo(-18, -2);
    ctx.moveTo(13, -23);
    ctx.lineTo(17, -2);
    ctx.stroke();

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-20, -29);
    ctx.bezierCurveTo(-21, -42, -7, -44, 10, -41);
    ctx.quadraticCurveTo(16, -50, 21, -56);
    ctx.lineTo(30, -52);
    ctx.lineTo(29, -46);
    ctx.lineTo(21, -45);
    ctx.quadraticCurveTo(19, -34, 16, -26);
    ctx.bezierCurveTo(10, -20, -14, -20, -20, -29);
    ctx.closePath();
    ctx.fillStyle = '#EFE6D5';
    ctx.fill();
    ctx.clip();

    ctx.strokeStyle = '#1E1A17';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    const xs = [-17, -12, -7, -2, 3, 8, 13, 18];
    for (let i = 0; i < xs.length; i++) {
        ctx.moveTo(xs[i], -56);
        ctx.quadraticCurveTo(xs[i] - 2.4, -37, xs[i] + 1, -19);
    }
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#201B18';
    ctx.beginPath();
    ctx.ellipse(29, -49, 3.0, 2.4, 0.2, 0, Math.PI * 2);
    ctx.fill();
}

function drawHallRhino(ctx) {
    drawAnimalShadow(ctx, 34, 6.2);
    ctx.fillStyle = '#3E3934';
    ctx.fillRect(-20, -21, 8, 20);
    ctx.fillRect(8, -21, 8, 20);

    ctx.fillStyle = '#6A635B';
    ctx.beginPath();
    ctx.moveTo(-28, -30);
    ctx.bezierCurveTo(-29, -46, -13, -51, 6, -48);
    ctx.bezierCurveTo(18, -47, 25, -44, 32, -38);
    ctx.lineTo(39, -34);
    ctx.bezierCurveTo(42, -30, 40, -24, 33, -22);
    ctx.bezierCurveTo(21, -18, -17, -16, -28, -30);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#555049';
    ctx.fillRect(-25, -22, 9, 21);
    ctx.fillRect(14, -22, 9, 21);

    ctx.fillStyle = '#DDD0B8';
    ctx.beginPath();
    ctx.moveTo(34, -33);
    ctx.quadraticCurveTo(42, -43, 46, -50);
    ctx.quadraticCurveTo(41, -37, 39, -30);
    ctx.closePath();
    ctx.fill();
}

function drawHallLion(ctx) {
    drawAnimalShadow(ctx, 25, 5.0);
    ctx.strokeStyle = '#9D713B';
    ctx.lineWidth = 3.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-14, -20);
    ctx.lineTo(-16, -2);
    ctx.moveTo(9, -21);
    ctx.lineTo(11, -2);
    ctx.stroke();

    ctx.strokeStyle = '#CF9E5A';
    ctx.lineWidth = 3.6;
    ctx.beginPath();
    ctx.moveTo(-18, -20);
    ctx.lineTo(-20, -2);
    ctx.moveTo(13, -21);
    ctx.lineTo(16, -2);
    ctx.stroke();

    ctx.strokeStyle = '#BA8948';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-21, -28);
    ctx.quadraticCurveTo(-30, -26, -29, -17);
    ctx.stroke();

    ctx.fillStyle = '#D1A059';
    ctx.beginPath();
    ctx.ellipse(-2, -28, 20, 10.5, -0.05, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#5B3418';
    ctx.beginPath();
    ctx.arc(17, -34, 12.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#D9AA64';
    ctx.beginPath();
    ctx.ellipse(22, -34, 7.2, 6.0, 0.1, 0, Math.PI * 2);
    ctx.fill();
}

function drawHallAntelope(ctx) {
    drawAnimalShadow(ctx, 19, 4.2);
    ctx.strokeStyle = '#A87D4B';
    ctx.lineWidth = 2.3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-10, -22);
    ctx.lineTo(-12, -2);
    ctx.moveTo(-13, -22);
    ctx.lineTo(-15, -2);
    ctx.moveTo(9, -23);
    ctx.lineTo(11, -2);
    ctx.moveTo(12, -23);
    ctx.lineTo(15, -2);
    ctx.stroke();

    ctx.fillStyle = '#C89861';
    ctx.beginPath();
    ctx.ellipse(0, -28, 16, 7.5, -0.06, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(10, -32);
    ctx.lineTo(17, -47);
    ctx.lineTo(25, -45);
    ctx.lineTo(20, -40);
    ctx.lineTo(15, -26);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#3A281A';
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(17, -47);
    ctx.quadraticCurveTo(11, -60, 4, -64);
    ctx.moveTo(19, -46);
    ctx.quadraticCurveTo(14, -58, 8, -62);
    ctx.stroke();
}

function drawHallOstrich(ctx) {
    drawAnimalShadow(ctx, 14, 3.8);
    ctx.strokeStyle = '#D5A98A';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-2, -22);
    ctx.lineTo(-5, -2);
    ctx.moveTo(3, -22);
    ctx.lineTo(6, -2);
    ctx.stroke();

    ctx.fillStyle = '#201D1B';
    ctx.beginPath();
    ctx.ellipse(0, -28, 13, 9, -0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#F5EFE2';
    ctx.beginPath();
    ctx.ellipse(-6, -26, 7.5, 4.8, -0.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#DFB697';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(9, -31);
    ctx.quadraticCurveTo(13, -44, 11, -55);
    ctx.stroke();

    ctx.fillStyle = '#DFB697';
    ctx.beginPath();
    ctx.arc(12, -56, 3.6, 0, Math.PI * 2);
    ctx.fill();
}

function drawHallBuffalo(ctx) {
    drawAnimalShadow(ctx, 29, 5.5);
    ctx.fillStyle = '#2B2420';
    ctx.fillRect(-18, -21, 7, 20);
    ctx.fillRect(9, -21, 7, 20);

    ctx.fillStyle = '#3B312B';
    ctx.beginPath();
    ctx.ellipse(0, -30, 24, 14, -0.05, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(23, -30, 9.5, 8.5, 0.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#C7B89E';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(21, -38);
    ctx.quadraticCurveTo(14, -45, 22, -47);
    ctx.stroke();
}

const ANIMAL_PAINTERS = {
    elephant: drawHallElephant,
    giraffe: drawHallGiraffe,
    zebra: drawHallZebra,
    rhino: drawHallRhino,
    lion: drawHallLion,
    antelope: drawHallAntelope,
    ostrich: drawHallOstrich,
    buffalo: drawHallBuffalo
};

export function drawCentralHallCaravan(ctx, width, height, cameraX, loopLength, caravan, cache) {
    const { hallFloorTopY, hallFloorMidY, isNarrow } = cache.layout;
    const scaleBase = isNarrow ? 0.84 : Math.min(1.12, Math.max(0.88, height / 760));

    // Lignes subtiles du parquet de la grande nef centrale (1 seul batch stroke)
    ctx.strokeStyle = 'rgba(28, 17, 9, 0.24)';
    ctx.lineWidth = 1;
    const plankStep = 64;
    const plankOff = wrapLoopPosition(cameraX * 0.52, plankStep);
    ctx.beginPath();
    for (let x = -plankOff; x < width + plankStep; x += plankStep) {
        ctx.moveTo(x, hallFloorTopY);
        ctx.lineTo(x - 14, hallFloorMidY + 55);
    }
    ctx.stroke();

    const planes = [
        { key: 'far', factor: 0.44, baseY: hallFloorTopY + (hallFloorMidY - hallFloorTopY) * 0.54, alpha: 0.86 },
        { key: 'mid', factor: 0.58, baseY: hallFloorMidY + height * 0.035, alpha: 1.0 }
    ];

    for (let p = 0; p < planes.length; p++) {
        const plane = planes[p];
        const planeLoopLen = loopLength * plane.factor;
        const planeCam = cameraX * plane.factor;

        ctx.save();
        ctx.globalAlpha = plane.alpha;

        for (let i = 0; i < caravan.length; i++) {
            const animal = caravan[i];
            if (animal.plane !== plane.key) continue;

            const worldX = animal.loopNorm * planeLoopLen;
            const delta = shortestLoopDelta(planeCam, worldX, planeLoopLen);
            const screenX = width * 0.5 + delta;

            if (screenX < -120 || screenX > width + 120) continue;

            const painter = ANIMAL_PAINTERS[animal.kind];
            if (!painter) continue;

            ctx.save();
            ctx.translate(screenX, plane.baseY);
            ctx.scale(animal.facing * animal.scale * scaleBase, animal.scale * scaleBase);
            painter(ctx);
            ctx.restore();
        }

        ctx.restore();
    }
}

/* -------------------------------------------------------------------------
   5. RAYONS DE LUMIÈRE TAMISÉE & PARTICULES DE POUSSIÈRE (BATCH ULTRA-LÉGER)
   ------------------------------------------------------------------------- */
export function drawGallerySunbeamsAndDust(ctx, width, height, cameraX, elapsed, dustPool, cache, ledColor) {
    const beamSpacing = 330;
    const beamOff = wrapLoopPosition(cameraX * 0.36, beamSpacing);
    const botY = height * 0.86;
    const pulse = 0.86 + 0.14 * Math.sin(elapsed * 0.8);

    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.beginPath();
    for (let x = -beamOff - beamSpacing; x < width + beamSpacing * 1.4; x += beamSpacing) {
        ctx.moveTo(x - 36, 0);
        ctx.lineTo(x + 48, 0);
        ctx.lineTo(x - 30, botY);
        ctx.lineTo(x - 150, botY);
        ctx.closePath();
    }
    // Rayons dorés principaux préservés + très léger reflet coloré des LED du plafond
    ctx.fillStyle = cache.beamGrad;
    ctx.fill();

    if (ledColor) {
        ctx.fillStyle = `rgba(${ledColor.r}, ${ledColor.g}, ${ledColor.b}, 0.052)`;
        ctx.fill();

        // Légère caresse lumineuse colorée sur le parquet du hall central
        const { hallFloorTopY, walkwayFloorY } = cache.layout;
        ctx.fillStyle = `rgba(${ledColor.r}, ${ledColor.g}, ${ledColor.b}, 0.045)`;
        ctx.fillRect(0, hallFloorTopY, width, walkwayFloorY - hallFloorTopY);
    }

    // Particules de poussière dorées (regroupées en 1 seul path par frame)
    ctx.globalAlpha = 0.52;
    ctx.fillStyle = '#FFEEC0';
    ctx.beginPath();
    for (let i = 0; i < dustPool.length; i++) {
        const d = dustPool[i];
        const px = wrapLoopPosition(d.x - cameraX * d.parallax + Math.sin(elapsed * d.driftSpeed + d.phase) * 14, width);
        const py = wrapLoopPosition(d.y + elapsed * d.fallSpeed, height * 0.84);
        ctx.moveTo(px + d.r, py);
        ctx.arc(px, py, d.r, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.restore();
}

/* -------------------------------------------------------------------------
   6. COURSIVE JOUABLE (1.0x) & CARTELS CONSULTABLES
   ------------------------------------------------------------------------- */
export function drawPlayableCoursiveAndCartels(
    ctx,
    width,
    height,
    cameraX,
    playerPos,
    loopLength,
    elapsed,
    cartels,
    visitedIds,
    nearestCartelId,
    cache
) {
    drawTiledHorizontally(ctx, cache.coursiveTile, cameraX, cache.coursiveTopY, width);

    const { verriereBottomY, railingTopY, walkwayFloorY, girderTopY } = cache.layout;
    const floorTopY = walkwayFloorY - 26;
    const colStartY = Math.floor(verriereBottomY * 0.92);
    const visitedSet = new Set(visitedIds);

    // Colonnes fines en fonte XIXe partant de la corniche de verrière (laissent la verrière dégagée)
    const bayW = cache.coursiveBayW;
    const colOffset = wrapLoopPosition(cameraX, bayW);
    const ly = railingTopY - 82;
    for (let x = -colOffset + 64; x < width + bayW; x += bayW) {
        const colX = Math.floor(x);
        ctx.fillStyle = '#231A14';
        ctx.fillRect(colX - 4.5, colStartY, 9, floorTopY - colStartY + 2);
        ctx.fillStyle = '#6C543B';
        ctx.fillRect(colX - 1.2, colStartY, 2.8, floorTopY - colStartY + 2);
        // Chapiteau fin sous la corniche + bague au niveau de la balustrade
        ctx.fillStyle = '#5B4632';
        ctx.fillRect(colX - 9, colStartY, 18, 6);
        ctx.fillStyle = '#6C543B';
        ctx.fillRect(colX - 8, railingTopY - 6, 16, 8);

        const lx = colX + 16;
        ctx.strokeStyle = '#3C2E22';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(colX + 3.5, ly - 15);
        ctx.quadraticCurveTo(colX + 13, ly - 17, lx, ly - 4);
        ctx.stroke();

        ctx.drawImage(cache.lanternSprite.canvas, lx - 32, ly - 30, 64, 64);
    }

    // Repère discret du point de départ de la boucle (position 0)
    const startDelta = shortestLoopDelta(playerPos, 0, loopLength);
    const startScreenX = width * 0.5 + startDelta;
    if (startScreenX > -100 && startScreenX < width + 100) {
        ctx.save();
        ctx.strokeStyle = 'rgba(226, 188, 124, 0.52)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(startScreenX, floorTopY + 2);
        ctx.lineTo(startScreenX - 10, girderTopY - 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(218, 178, 114, 0.28)';
        ctx.beginPath();
        ctx.ellipse(startScreenX - 5, walkwayFloorY, 18, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // Cartels / panneaux consultables le long de la coursive
    const screenCartelBounds = [];

    for (let i = 0; i < cartels.length; i++) {
        const cartel = cartels[i];
        const delta = shortestLoopDelta(playerPos, cartel.loopPosition, loopLength);
        const cx = width * 0.5 + delta;

        if (cx < -110 || cx > width + 110) continue;

        const isNear = cartel.id === nearestCartelId;
        const isVisited = visitedSet.has(cartel.id);
        const pulse = 0.5 + 0.5 * Math.sin(elapsed * 3.8);

        ctx.save();
        ctx.translate(cx, floorTopY + 4);

        if (isNear) {
            ctx.save();
            ctx.globalAlpha = 0.78 + pulse * 0.22;
            ctx.drawImage(cache.cartelGlowSprite.canvas, -60, -112, 120, 120);
            ctx.restore();
        }

        ctx.fillStyle = 'rgba(18, 12, 8, 0.36)';
        ctx.beginPath();
        ctx.ellipse(0, 2, 22, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();

        if (cartel.visualKind === 'panel') {
            ctx.fillStyle = '#2B2018';
            ctx.fillRect(-16, -86, 3.5, 86);
            ctx.fillRect(12.5, -86, 3.5, 86);

            ctx.fillStyle = isNear ? '#3A2A1E' : '#261C14';
            ctx.strokeStyle = isNear ? '#F3D28B' : (isVisited ? '#C59B5F' : '#8C6D46');
            ctx.lineWidth = isNear ? 2.4 : 1.6;
            ctx.beginPath();
            ctx.roundRect(-24, -84, 48, 46, 5);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = isNear ? '#FAF0DC' : '#E7D8BE';
            ctx.beginPath();
            ctx.roundRect(-19, -78, 38, 34, 3);
            ctx.fill();

            ctx.fillStyle = '#3A2A1C';
            ctx.fillRect(-13, -72, 20, 2.4);
            ctx.fillStyle = 'rgba(58, 42, 28, 0.45)';
            ctx.fillRect(-13, -65, 26, 1.8);
            ctx.fillRect(-13, -60, 23, 1.8);
            ctx.fillRect(-13, -55, 18, 1.8);
        } else {
            ctx.fillStyle = '#261D17';
            ctx.fillRect(-3.5, -54, 7, 54);
            ctx.fillStyle = '#3B2C21';
            ctx.fillRect(-11, -4, 22, 5);

            ctx.fillStyle = isNear ? '#3D2C1E' : '#281D15';
            ctx.strokeStyle = isNear ? '#F3D28B' : (isVisited ? '#C59B5F' : '#8C6D46');
            ctx.lineWidth = isNear ? 2.2 : 1.5;
            ctx.beginPath();
            ctx.roundRect(-22, -68, 44, 26, 4);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = isNear ? '#FAF0DC' : '#E6D6BC';
            ctx.beginPath();
            ctx.roundRect(-17, -64, 34, 18, 2);
            ctx.fill();

            ctx.fillStyle = '#3A2A1C';
            ctx.fillRect(-12, -59, 18, 2.2);
            ctx.fillStyle = 'rgba(58, 42, 28, 0.48)';
            ctx.fillRect(-12, -53, 24, 1.8);
        }

        // Pastille numérotée (ou coche si déjà consulté)
        const badgeY = cartel.visualKind === 'panel' ? -96 : -82;
        ctx.fillStyle = isVisited ? '#C59B5F' : (isNear ? '#F6DC9E' : 'rgba(26, 19, 14, 0.88)');
        ctx.strokeStyle = isNear ? '#FFF0C2' : 'rgba(218, 178, 114, 0.65)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, badgeY, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isVisited || isNear ? '#1E150F' : '#EFE2C8';
        ctx.font = '600 9px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(isVisited ? '✓' : cartel.number, 0, badgeY + 0.5);

        if (isNear) {
            const floatY = badgeY - 19 - Math.sin(elapsed * 4.5) * 3.5;
            ctx.fillStyle = '#F7DF9C';
            ctx.beginPath();
            ctx.moveTo(0, floatY - 5);
            ctx.lineTo(4.5, floatY);
            ctx.lineTo(0, floatY + 5);
            ctx.lineTo(-4.5, floatY);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();

        screenCartelBounds.push({
            id: cartel.id,
            cartel,
            x: cx - 34,
            y: floorTopY - 108,
            w: 68,
            h: 118
        });
    }

    return screenCartelBounds;
}

/* -------------------------------------------------------------------------
   7. POUTRELLE PREMIER PLAN EN BAS DE L'ÉCRAN (PARALLAXE 1.18x)
   ------------------------------------------------------------------------- */
export function drawForegroundCoursiveGirder(ctx, width, cameraX, cache) {
    drawTiledHorizontally(ctx, cache.girderTile, cameraX * 1.18, cache.layout.girderTopY, width);
}

/* -------------------------------------------------------------------------
   8. MINI-CARTE CIRCULAIRE DU MUSÉE (PROGRESSION EN BOUCLE 360°)
   ------------------------------------------------------------------------- */
export function drawCircularMuseumMinimap(ctx, size, state, cartels, loopLength) {
    ctx.clearRect(0, 0, size, size);
    const cx = size * 0.5;
    const cy = size * 0.5;
    const outerR = size * 0.46;
    const trackR = size * 0.34;
    const hallR = size * 0.19;
    const visitedSet = new Set(state.visitedCartelIds);

    ctx.save();

    ctx.fillStyle = 'rgba(20, 15, 11, 0.9)';
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(218, 178, 114, 0.48)';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.fillStyle = 'rgba(197, 155, 95, 0.14)';
    ctx.strokeStyle = 'rgba(218, 178, 114, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, hallR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = 'rgba(232, 213, 181, 0.26)';
    ctx.lineWidth = 4.2;
    ctx.beginPath();
    ctx.arc(cx, cy, trackR, 0, Math.PI * 2);
    ctx.stroke();

    const norm = wrapLoopPosition(state.playerPos, loopLength) / loopLength;
    const startAngle = -Math.PI * 0.5;
    const playerAngle = startAngle + norm * Math.PI * 2;

    if (norm > 0.004 || state.lapsCompleted > 0) {
        ctx.strokeStyle = 'rgba(244, 206, 128, 0.72)';
        ctx.lineWidth = 3.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        if (state.lapsCompleted > 0) {
            ctx.arc(cx, cy, trackR, 0, Math.PI * 2);
        } else {
            ctx.arc(cx, cy, trackR, startAngle, playerAngle);
        }
        ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(255, 240, 204, 0.75)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(cx, cy - trackR - 4.5);
    ctx.lineTo(cx, cy - trackR + 4.5);
    ctx.stroke();

    for (let i = 0; i < cartels.length; i++) {
        const c = cartels[i];
        const a = startAngle + (wrapLoopPosition(c.loopPosition, loopLength) / loopLength) * Math.PI * 2;
        const mx = cx + Math.cos(a) * trackR;
        const my = cy + Math.sin(a) * trackR;
        const visited = visitedSet.has(c.id);

        ctx.fillStyle = visited ? '#F6D365' : 'rgba(232, 213, 181, 0.52)';
        ctx.beginPath();
        ctx.arc(mx, my, visited ? 2.8 : 2.1, 0, Math.PI * 2);
        ctx.fill();
    }

    const px = cx + Math.cos(playerAngle) * trackR;
    const py = cy + Math.sin(playerAngle) * trackR;

    ctx.fillStyle = 'rgba(255, 224, 102, 0.34)';
    ctx.beginPath();
    ctx.arc(px, py, 7.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFE066';
    ctx.strokeStyle = '#1B130D';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(px, py, 3.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
}

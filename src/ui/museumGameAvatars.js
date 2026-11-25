/**
 * ============================================================================
 * AVATARS VUE DE CÔTÉ 2D — ALEXIS & CLARA (JEU MUSÉUM CASE 22)
 * ============================================================================
 * Réutilise exactement la palette, les tenues, les coiffures et les proportions
 * d'intro-avatars.js (Alexis : pull/veste vert sapin, pantalon sombre, coupe
 * brune ; Clara : longs cheveux bruns ondulants, t-shirt jaune, pantalon blanc)
 * adaptés en profil 2D fluide avec cycle de marche synchronisé à la distance.
 * ============================================================================
 */

import { AVATAR_COLORS } from './intro-avatars.js';

/**
 * Dessine l'ombre au sol et le léger reflet sur le parquet ciré de la coursive.
 */
function drawFloorContact(ctx, x, y, scale, bob, widthFactor = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Ombre douce ancrée au sol
    ctx.fillStyle = 'rgba(18, 12, 8, 0.36)';
    ctx.beginPath();
    ctx.ellipse(0, 2, 13 * widthFactor, 3.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Très léger reflet chaud sur le parquet ciré
    const sheenGrad = ctx.createRadialGradient(0, 5, 1, 0, 5, 16 * widthFactor);
    sheenGrad.addColorStop(0, 'rgba(255, 224, 162, 0.12)');
    sheenGrad.addColorStop(1, 'rgba(255, 224, 162, 0)');
    ctx.fillStyle = sheenGrad;
    ctx.beginPath();
    ctx.ellipse(0, 6 + bob * 0.15, 14 * widthFactor, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

/**
 * Dessine Alexis en vue de côté 2D (origine (x, y) = pieds au sol).
 * `facing`: +1 vers la droite, -1 vers la gauche.
 */
export function drawSideAlexis(ctx, x, y, scale, walkCycle, isWalking, facing = 1) {
    const stride = isWalking ? Math.sin(walkCycle) : 0;
    const armStride = isWalking ? Math.sin(walkCycle + Math.PI) : 0;
    const bob = isWalking
        ? Math.abs(Math.sin(walkCycle)) * 2.1
        : Math.sin(walkCycle * 0.7) * 0.45;
    const lean = isWalking ? 0.045 : 0;

    drawFloorContact(ctx, x, y, scale * 1.05, bob, 1.05);

    ctx.save();
    ctx.translate(x, y - bob);
    ctx.scale(facing * scale * 1.04, scale * 1.06);
    ctx.rotate(lean);

    // --- 1. BRAS ARRIÈRE (légèrement ombré) ---
    const backArmX = armStride * 8.5;
    const backArmY = -21 + Math.abs(armStride) * 1.2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = AVATAR_COLORS.ALEXIS_JACKET_SHADE;
    ctx.lineWidth = 4.9;
    ctx.beginPath();
    ctx.moveTo(-1, -46);
    ctx.quadraticCurveTo(backArmX * 0.5 - 1, -34, backArmX, backArmY);
    ctx.stroke();

    ctx.fillStyle = AVATAR_COLORS.ALEXIS_SKIN_SHADE;
    ctx.beginPath();
    ctx.arc(backArmX, backArmY + 1.4, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // --- 2. JAMBE ARRIÈRE ---
    const backFootX = -stride * 9.5;
    const backFootY = -2.2 - Math.max(0, -stride) * 2.6;
    ctx.strokeStyle = AVATAR_COLORS.ALEXIS_PANTS_SHADE;
    ctx.lineWidth = 6.2;
    ctx.beginPath();
    ctx.moveTo(-1, -24);
    ctx.quadraticCurveTo(backFootX * 0.45 + 1.5, -13, backFootX, backFootY);
    ctx.stroke();

    ctx.fillStyle = AVATAR_COLORS.SHOES;
    ctx.beginPath();
    ctx.ellipse(backFootX + 2.2, backFootY + 1.4, 4.6, 2.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // --- 3. JAMBE AVANT ---
    const frontFootX = stride * 9.5;
    const frontFootY = -2.2 - Math.max(0, stride) * 2.6;
    ctx.strokeStyle = AVATAR_COLORS.ALEXIS_PANTS;
    ctx.lineWidth = 6.5;
    ctx.beginPath();
    ctx.moveTo(0.5, -24);
    ctx.quadraticCurveTo(frontFootX * 0.45 + 1.8, -13, frontFootX, frontFootY);
    ctx.stroke();

    ctx.fillStyle = AVATAR_COLORS.SHOES;
    ctx.beginPath();
    ctx.ellipse(frontFootX + 2.4, frontFootY + 1.4, 4.8, 2.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // --- 4. BASSIN / HAUT DU PANTALON ---
    ctx.fillStyle = AVATAR_COLORS.ALEXIS_PANTS;
    ctx.beginPath();
    ctx.roundRect(-6.8, -28.5, 13.8, 8.2, 3.8);
    ctx.fill();

    // --- 5. TORSE : PULL / VESTE VERT SAPIN ---
    const jacketGrad = ctx.createLinearGradient(-8, -54, 8, -24);
    jacketGrad.addColorStop(0, AVATAR_COLORS.ALEXIS_JACKET_TOP);
    jacketGrad.addColorStop(0.55, AVATAR_COLORS.ALEXIS_JACKET_MID);
    jacketGrad.addColorStop(1, AVATAR_COLORS.ALEXIS_JACKET_SHADE);
    ctx.fillStyle = jacketGrad;
    ctx.beginPath();
    ctx.moveTo(-7.2, -51.5);
    ctx.quadraticCurveTo(1.5, -54.5, 8.4, -50.2);
    ctx.bezierCurveTo(9.4, -40, 8.2, -31, 6.8, -24.8);
    ctx.quadraticCurveTo(0, -22.5, -7.2, -25.2);
    ctx.bezierCurveTo(-8.4, -33, -8.2, -43, -7.2, -51.5);
    ctx.closePath();
    ctx.fill();

    // Col discret clair
    ctx.strokeStyle = 'rgba(232, 213, 181, 0.34)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-2.5, -52.2);
    ctx.quadraticCurveTo(2.4, -49.5, 6.4, -51.2);
    ctx.stroke();

    // --- 6. COU & TÊTE DE PROFIL ---
    ctx.fillStyle = AVATAR_COLORS.ALEXIS_SKIN;
    ctx.beginPath();
    ctx.roundRect(-2.1, -58.8, 4.6, 7.2, 2);
    ctx.fill();

    const headY = -65.2;
    ctx.fillStyle = AVATAR_COLORS.ALEXIS_SKIN;
    ctx.beginPath();
    ctx.ellipse(0.9, headY, 7.3, 7.7, -0.05, 0, Math.PI * 2);
    ctx.fill();

    // Profil doux : nez fin, œil expressif, léger sourire
    ctx.beginPath();
    ctx.moveTo(7.4, headY - 1.2);
    ctx.quadraticCurveTo(9.1, headY + 0.5, 7.5, headY + 1.8);
    ctx.fill();

    ctx.fillStyle = '#2A1B12';
    ctx.beginPath();
    ctx.arc(4.8, headY - 0.9, 1.05, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(130, 82, 58, 0.52)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.arc(5.1, headY + 2.3, 1.9, 0.18, Math.PI * 0.62);
    ctx.stroke();

    // --- 7. COUPE BRUNE D'ALEXIS (mêmes teintes que intro-avatars.js) ---
    const hairGrad = ctx.createLinearGradient(0, headY - 10, 0, headY + 5);
    hairGrad.addColorStop(0, '#4A2E1D');
    hairGrad.addColorStop(0.55, '#341E11');
    hairGrad.addColorStop(1, '#24130A');
    ctx.fillStyle = hairGrad;
    ctx.beginPath();
    ctx.moveTo(-6.6, headY + 1.1);
    ctx.bezierCurveTo(-8.2, headY - 4.8, -4.6, headY - 9.8, 1.5, headY - 9.4);
    ctx.bezierCurveTo(6.2, headY - 9.0, 8.7, headY - 6.0, 7.8, headY - 3.3);
    ctx.quadraticCurveTo(4.2, headY - 4.8, 1.1, headY - 3.4);
    ctx.quadraticCurveTo(-1.0, headY - 1.2, -1.5, headY + 2.1);
    ctx.quadraticCurveTo(-4.8, headY + 3.8, -6.6, headY + 1.1);
    ctx.closePath();
    ctx.fill();

    // Léger reflet chaud de la verrière sur les cheveux
    ctx.strokeStyle = 'rgba(244, 212, 152, 0.32)';
    ctx.lineWidth = 0.95;
    ctx.beginPath();
    ctx.moveTo(-4.0, headY - 6.2);
    ctx.quadraticCurveTo(0.8, headY - 8.4, 5.0, headY - 6.2);
    ctx.stroke();

    // --- 8. BRAS AVANT ---
    const frontArmX = -armStride * 8.8;
    const frontArmY = -20.5 + Math.abs(armStride) * 1.1;
    ctx.strokeStyle = AVATAR_COLORS.ALEXIS_JACKET_TOP;
    ctx.lineWidth = 5.1;
    ctx.beginPath();
    ctx.moveTo(0.6, -46);
    ctx.quadraticCurveTo(frontArmX * 0.45 - 0.8, -33.5, frontArmX, frontArmY);
    ctx.stroke();

    ctx.fillStyle = AVATAR_COLORS.ALEXIS_SKIN;
    ctx.beginPath();
    ctx.arc(frontArmX, frontArmY + 1.5, 2.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

/**
 * Dessine Clara en vue de côté 2D (origine (x, y) = pieds au sol).
 * `facing`: +1 vers la droite, -1 vers la gauche.
 */
export function drawSideClara(ctx, x, y, scale, walkCycle, isWalking, facing = 1, hairSway = 0) {
    const stride = isWalking ? Math.sin(walkCycle) : 0;
    const armStride = isWalking ? Math.sin(walkCycle + Math.PI) : 0;
    const bob = isWalking
        ? Math.abs(Math.sin(walkCycle)) * 2.0
        : Math.sin(walkCycle * 0.7 + 1.1) * 0.42;
    const lean = isWalking ? 0.04 : 0;
    const sway = (isWalking ? -3.2 : 0) + hairSway;

    drawFloorContact(ctx, x, y, scale, bob, 1.0);

    ctx.save();
    ctx.translate(x, y - bob);
    ctx.scale(facing * scale, scale);
    ctx.rotate(lean);

    // --- 1. BRAS ARRIÈRE ---
    const backArmX = armStride * 8.2;
    const backArmY = -22 + Math.abs(armStride) * 1.2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = AVATAR_COLORS.CLARA_SKIN_SHADE;
    ctx.lineWidth = 4.2;
    ctx.beginPath();
    ctx.moveTo(-0.5, -45);
    ctx.quadraticCurveTo(backArmX * 0.45 - 0.8, -34, backArmX, backArmY);
    ctx.stroke();

    // Manche courte arrière jaune
    ctx.strokeStyle = AVATAR_COLORS.CLARA_TSHIRT_SHADE;
    ctx.lineWidth = 5.0;
    ctx.beginPath();
    ctx.moveTo(-0.5, -46);
    ctx.lineTo(backArmX * 0.34, -39.2);
    ctx.stroke();

    // --- 2. JAMBE ARRIÈRE (pantalon blanc ombré) ---
    const backFootX = -stride * 9.2;
    const backFootY = -2.2 - Math.max(0, -stride) * 2.5;
    ctx.strokeStyle = AVATAR_COLORS.CLARA_PANTS_SHADE;
    ctx.lineWidth = 6.0;
    ctx.beginPath();
    ctx.moveTo(-0.8, -24.5);
    ctx.quadraticCurveTo(backFootX * 0.45 + 1.4, -13.5, backFootX, backFootY);
    ctx.stroke();

    ctx.fillStyle = AVATAR_COLORS.SHOES;
    ctx.beginPath();
    ctx.ellipse(backFootX + 2.1, backFootY + 1.4, 4.3, 2.1, 0, 0, Math.PI * 2);
    ctx.fill();

    // --- 3. JAMBE AVANT (pantalon blanc) ---
    const frontFootX = stride * 9.2;
    const frontFootY = -2.2 - Math.max(0, stride) * 2.5;
    ctx.strokeStyle = AVATAR_COLORS.CLARA_PANTS;
    ctx.lineWidth = 6.2;
    ctx.beginPath();
    ctx.moveTo(0.4, -24.5);
    ctx.quadraticCurveTo(frontFootX * 0.45 + 1.6, -13.5, frontFootX, frontFootY);
    ctx.stroke();

    ctx.fillStyle = AVATAR_COLORS.SHOES;
    ctx.beginPath();
    ctx.ellipse(frontFootX + 2.2, frontFootY + 1.4, 4.5, 2.1, 0, 0, Math.PI * 2);
    ctx.fill();

    // --- 4. HANCHES / HAUT DU PANTALON BLANC ---
    const pantsGrad = ctx.createLinearGradient(-7, -29, 7, -21);
    pantsGrad.addColorStop(0, AVATAR_COLORS.CLARA_PANTS);
    pantsGrad.addColorStop(1, AVATAR_COLORS.CLARA_PANTS_SHADE);
    ctx.fillStyle = pantsGrad;
    ctx.beginPath();
    ctx.roundRect(-6.8, -29.2, 13.6, 8.2, 3.8);
    ctx.fill();

    // --- 5. T-SHIRT JAUNE DE CLARA ---
    const shirtGrad = ctx.createLinearGradient(-8, -53, 8, -27);
    shirtGrad.addColorStop(0, AVATAR_COLORS.CLARA_TSHIRT_TOP);
    shirtGrad.addColorStop(0.58, AVATAR_COLORS.CLARA_TSHIRT_MID);
    shirtGrad.addColorStop(1, AVATAR_COLORS.CLARA_TSHIRT_SHADE);
    ctx.fillStyle = shirtGrad;
    ctx.beginPath();
    ctx.moveTo(-6.8, -50.8);
    ctx.quadraticCurveTo(1.2, -53.2, 7.6, -49.5);
    ctx.lineTo(6.8, -27.5);
    ctx.quadraticCurveTo(0, -25.8, -6.8, -27.8);
    ctx.closePath();
    ctx.fill();

    // --- 6. COU & TÊTE DE PROFIL ---
    ctx.fillStyle = AVATAR_COLORS.CLARA_SKIN;
    ctx.beginPath();
    ctx.roundRect(-2.1, -57.8, 4.4, 7.2, 2);
    ctx.fill();

    const headY = -64.0;
    ctx.fillStyle = AVATAR_COLORS.CLARA_SKIN;
    ctx.beginPath();
    ctx.ellipse(1.1, headY, 7.5, 7.8, -0.04, 0, Math.PI * 2);
    ctx.fill();

    // Profil doux : nez fin, œil, léger sourire
    ctx.beginPath();
    ctx.moveTo(7.8, headY - 1.1);
    ctx.quadraticCurveTo(9.4, headY + 0.5, 7.8, headY + 1.7);
    ctx.fill();

    ctx.fillStyle = '#2B1A11';
    ctx.beginPath();
    ctx.arc(5.1, headY - 0.8, 1.05, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(138, 86, 62, 0.52)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.arc(5.4, headY + 2.3, 1.9, 0.18, Math.PI * 0.62);
    ctx.stroke();

    // --- 7. LONGS CHEVEUX BRUNS ONDULANTS DE CLARA (signature exacte) ---
    const hairGrad = ctx.createLinearGradient(0, headY - 10, 0, headY + 34);
    hairGrad.addColorStop(0, '#4B2E1B');
    hairGrad.addColorStop(0.5, '#382012');
    hairGrad.addColorStop(1, '#27150B');
    ctx.fillStyle = hairGrad;

    ctx.beginPath();
    ctx.moveTo(7.6, headY - 3.8);
    ctx.bezierCurveTo(6.7, headY - 9.8, -2.2, headY - 10.4, -7.1, headY - 4.2);
    ctx.bezierCurveTo(-10.4, headY + 4, -11.6 + sway * 0.75, headY + 19, -9.2 + sway, headY + 31.5);
    ctx.quadraticCurveTo(-4.4 + sway * 0.85, headY + 34.2, -2.0 + sway * 0.55, headY + 30.2);
    ctx.bezierCurveTo(-2.3 + sway * 0.35, headY + 17.5, -1.4, headY + 6.5, 0.8, headY - 1.4);
    ctx.quadraticCurveTo(3.9, headY - 4.2, 7.6, headY - 3.8);
    ctx.closePath();
    ctx.fill();

    // Reflets bruns & lumière chaude de la verrière dans les longueurs
    ctx.strokeStyle = 'rgba(244, 210, 148, 0.28)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(-3.8, headY - 6.4);
    ctx.quadraticCurveTo(1.0, headY - 8.2, 5.2, headY - 5.4);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(128, 82, 50, 0.48)';
    ctx.lineWidth = 1.05;
    ctx.beginPath();
    ctx.moveTo(-3.8, headY - 4.8);
    ctx.quadraticCurveTo(-7.6 + sway * 0.45, headY + 10, -6.4 + sway * 0.85, headY + 27);
    ctx.stroke();

    // --- 8. BRAS AVANT + MANCHE COURTE JAUNE ---
    const frontArmX = -armStride * 8.4;
    const frontArmY = -21.5 + Math.abs(armStride) * 1.1;
    ctx.strokeStyle = AVATAR_COLORS.CLARA_SKIN;
    ctx.lineWidth = 4.4;
    ctx.beginPath();
    ctx.moveTo(0.8, -45);
    ctx.quadraticCurveTo(frontArmX * 0.45 - 0.5, -33.5, frontArmX, frontArmY);
    ctx.stroke();

    ctx.strokeStyle = AVATAR_COLORS.CLARA_TSHIRT_TOP;
    ctx.lineWidth = 5.4;
    ctx.beginPath();
    ctx.moveTo(0.8, -46);
    ctx.lineTo(frontArmX * 0.36 + 0.4, -38.8);
    ctx.stroke();

    ctx.restore();
}

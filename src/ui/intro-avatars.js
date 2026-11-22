/**
 * ============================================================================
 * AVATARS PARTAGÉS D'ALEXIS & CLARA POUR LES ANIMATIONS D'OUVERTURE
 * - Repris exactement du jeu du Jour 8 (Bain de Minuit au Cap Ferret), habillés :
 *   • Clara : longs cheveux bruns du jour 8, t-shirt jaune, pantalon blanc
 *   • Alexis : coupe brune du jour 8, veste/pull vert sapin, pantalon sombre
 * - Aucun prénom affiché.
 * ============================================================================
 */

export const AVATAR_COLORS = {
    CLARA_SKIN: '#E6C1A3',
    CLARA_SKIN_SHADE: '#D7AD8C',
    CLARA_TSHIRT_TOP: '#FFE066',
    CLARA_TSHIRT_MID: '#F7D046',
    CLARA_TSHIRT_SHADE: '#DFB426',
    CLARA_PANTS: '#FAF8F4',
    CLARA_PANTS_SHADE: '#E0DAD0',
    ALEXIS_SKIN: '#E5C0A1',
    ALEXIS_SKIN_SHADE: '#D4AA88',
    ALEXIS_JACKET_TOP: '#2C4C3E',
    ALEXIS_JACKET_MID: '#1E352B',
    ALEXIS_JACKET_SHADE: '#15271F',
    ALEXIS_PANTS: '#253040',
    ALEXIS_PANTS_SHADE: '#1A2330',
    SHOES: '#201D1B'
};

export function drawAlexisHair(ctx, lookX, headY) {
    const hairGrad = ctx.createLinearGradient(lookX, headY - 10, lookX, headY + 6);
    hairGrad.addColorStop(0, '#4A2E1D');
    hairGrad.addColorStop(0.55, '#341E11');
    hairGrad.addColorStop(1, '#24130A');
    ctx.fillStyle = hairGrad;

    ctx.beginPath();
    ctx.moveTo(lookX - 8.2, headY + 1.5);
    ctx.bezierCurveTo(lookX - 9.4, headY - 4.5, lookX - 6.5, headY - 10.2, lookX, headY - 10.4);
    ctx.bezierCurveTo(lookX + 6.5, headY - 10.2, lookX + 9.4, headY - 4.5, lookX + 8.2, headY + 1.5);
    ctx.quadraticCurveTo(lookX + 6.2, headY + 5.2, lookX + 3.4, headY + 5.8);
    ctx.quadraticCurveTo(lookX, headY + 6.4, lookX - 3.4, headY + 5.8);
    ctx.quadraticCurveTo(lookX - 6.2, headY + 5.2, lookX - 8.2, headY + 1.5);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(115, 76, 48, 0.38)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.arc(lookX - 2.5, headY - 3, 4.5, Math.PI * 1.1, Math.PI * 1.85);
    ctx.moveTo(lookX + 1.5, headY - 7.2);
    ctx.quadraticCurveTo(lookX + 5.2, headY - 4.5, lookX + 4.8, headY + 1);
    ctx.stroke();
}

export function drawIntroAlexis(ctx, x, y, scale, walkCycle, isWalking, goldenBacklight) {
    const legSwing = isWalking ? Math.sin(walkCycle) * 5.2 : 0;
    const armSwing = isWalking ? Math.cos(walkCycle) * 4.2 : 0;
    const bob = isWalking ? Math.abs(Math.sin(walkCycle)) * 1.6 : Math.sin(walkCycle * 0.4) * 0.35;

    ctx.save();
    ctx.translate(x, y - bob);
    ctx.scale(scale * 1.04, scale * 1.06);

    // Ombre douce au sol
    ctx.fillStyle = 'rgba(12, 22, 38, 0.34)';
    ctx.beginPath();
    ctx.ellipse(0, 28 + bob, 13, 4.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Halo doré discret face à la lumière
    if (goldenBacklight > 0.02) {
        const rim = ctx.createRadialGradient(0, -14, 4, 0, -14, 34);
        rim.addColorStop(0, `rgba(255, 232, 168, ${0.42 * goldenBacklight})`);
        rim.addColorStop(1, 'rgba(255, 232, 168, 0)');
        ctx.fillStyle = rim;
        ctx.beginPath();
        ctx.arc(0, -14, 34, 0, Math.PI * 2);
        ctx.fill();
    }

    // Chaussures / bottes
    ctx.fillStyle = AVATAR_COLORS.SHOES;
    ctx.beginPath();
    ctx.ellipse(-5.1 - legSwing * 0.16, 26.5 + legSwing * 0.42, 3.8, 2.2, 0, 0, Math.PI * 2);
    ctx.ellipse(5.1 + legSwing * 0.16, 26.5 - legSwing * 0.42, 3.8, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pantalon sombre d'Alexis (jambes)
    ctx.lineCap = 'round';
    ctx.strokeStyle = AVATAR_COLORS.ALEXIS_PANTS;
    ctx.lineWidth = 6.8;
    ctx.beginPath();
    ctx.moveTo(-4.8, 1);
    ctx.lineTo(-5.1 - legSwing * 0.18, 25 + legSwing * 0.42);
    ctx.stroke();

    ctx.strokeStyle = AVATAR_COLORS.ALEXIS_PANTS_SHADE;
    ctx.beginPath();
    ctx.moveTo(4.8, 1);
    ctx.lineTo(5.1 + legSwing * 0.18, 25 - legSwing * 0.42);
    ctx.stroke();

    // Bassin / haut du pantalon
    ctx.fillStyle = AVATAR_COLORS.ALEXIS_PANTS;
    ctx.beginPath();
    ctx.roundRect(-9.2, -2, 18.4, 8, 4);
    ctx.fill();

    // Mains couleur peau d'Alexis
    ctx.fillStyle = AVATAR_COLORS.ALEXIS_SKIN_SHADE;
    ctx.beginPath();
    ctx.arc(-13.4, -1.5 + armSwing, 2.4, 0, Math.PI * 2);
    ctx.arc(13.4, -1.5 - armSwing, 2.4, 0, Math.PI * 2);
    ctx.fill();

    // Manches de la veste / pull vert sapin
    ctx.strokeStyle = AVATAR_COLORS.ALEXIS_JACKET_MID;
    ctx.lineWidth = 5.4;
    ctx.beginPath();
    ctx.moveTo(-11.2, -26);
    ctx.quadraticCurveTo(-15.2, -14, -13.3, -3 + armSwing);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(11.2, -26);
    ctx.quadraticCurveTo(15.2, -14, 13.3, -3 - armSwing);
    ctx.stroke();

    // Dos habillé d'Alexis (veste / pull vert sapin)
    const jacketGrad = ctx.createLinearGradient(-11, -30, 11, 4);
    jacketGrad.addColorStop(0, AVATAR_COLORS.ALEXIS_JACKET_TOP);
    jacketGrad.addColorStop(0.55, AVATAR_COLORS.ALEXIS_JACKET_MID);
    jacketGrad.addColorStop(1, AVATAR_COLORS.ALEXIS_JACKET_SHADE);
    ctx.fillStyle = jacketGrad;

    ctx.beginPath();
    ctx.moveTo(-11.6, -28.5);
    ctx.quadraticCurveTo(0, -31.8, 11.6, -28.5);
    ctx.bezierCurveTo(11.2, -18, 10.2, -8, 9.8, 1.5);
    ctx.quadraticCurveTo(0, 3.8, -9.8, 1.5);
    ctx.bezierCurveTo(-10.2, -8, -11.2, -18, -11.6, -28.5);
    ctx.closePath();
    ctx.fill();

    // Col discret du pull / veste
    ctx.strokeStyle = 'rgba(232, 213, 181, 0.28)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(-5.2, -29.2);
    ctx.quadraticCurveTo(0, -26.5, 5.2, -29.2);
    ctx.stroke();

    // Cou et tête d'Alexis (proportions exactes du jour 8)
    ctx.fillStyle = AVATAR_COLORS.ALEXIS_SKIN;
    ctx.beginPath();
    ctx.roundRect(-2.8, -36.5, 5.6, 7.2, 2);
    ctx.fill();

    const headY = -43.2;
    ctx.beginPath();
    ctx.arc(0, headY, 8.6, 0, Math.PI * 2);
    ctx.fill();

    // Coupe de cheveux bruns exacte du jour 8
    ctx.save();
    ctx.translate(0, headY);
    ctx.scale(1.06, 1.06);
    drawAlexisHair(ctx, 0, 0);
    ctx.restore();

    ctx.restore();
}

export function drawIntroClara(ctx, x, y, scale, walkCycle, isWalking, hairSway, goldenBacklight) {
    const legSwing = isWalking ? Math.sin(walkCycle) * 5.5 : 0;
    const armSwing = isWalking ? Math.cos(walkCycle) * 4.5 : 0;
    const bob = isWalking ? Math.abs(Math.sin(walkCycle)) * 1.5 : Math.sin(walkCycle * 0.4 + 1) * 0.35;

    ctx.save();
    ctx.translate(x, y - bob);
    ctx.scale(scale, scale);

    // Ombre douce au sol
    ctx.fillStyle = 'rgba(12, 22, 38, 0.32)';
    ctx.beginPath();
    ctx.ellipse(0, 28 + bob, 12, 4.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Halo doré discret face à la lumière
    if (goldenBacklight > 0.02) {
        const rim = ctx.createRadialGradient(0, -14, 4, 0, -14, 34);
        rim.addColorStop(0, `rgba(255, 232, 168, ${0.44 * goldenBacklight})`);
        rim.addColorStop(1, 'rgba(255, 232, 168, 0)');
        ctx.fillStyle = rim;
        ctx.beginPath();
        ctx.arc(0, -14, 34, 0, Math.PI * 2);
        ctx.fill();
    }

    // Chaussures
    ctx.fillStyle = AVATAR_COLORS.SHOES;
    ctx.beginPath();
    ctx.ellipse(-5.1 - legSwing * 0.18, 26.8 + legSwing * 0.45, 3.5, 2.1, 0, 0, Math.PI * 2);
    ctx.ellipse(5.1 + legSwing * 0.18, 26.8 - legSwing * 0.45, 3.5, 2.1, 0, 0, Math.PI * 2);
    ctx.fill();

    // PANTALON BLANC DE CLARA (jambes, même géométrie que jour 8)
    ctx.lineCap = 'round';
    ctx.strokeStyle = AVATAR_COLORS.CLARA_PANTS;
    ctx.lineWidth = 6.6;
    ctx.beginPath();
    ctx.moveTo(-4.8, 2);
    ctx.lineTo(-5.2 - legSwing * 0.2, 25.2 + legSwing * 0.45);
    ctx.stroke();

    ctx.strokeStyle = AVATAR_COLORS.CLARA_PANTS_SHADE;
    ctx.beginPath();
    ctx.moveTo(4.8, 2);
    ctx.lineTo(5.2 + legSwing * 0.2, 25.2 - legSwing * 0.45);
    ctx.stroke();

    // Haut du pantalon blanc (hanches)
    const pantsGrad = ctx.createLinearGradient(-10, -4, 10, 6);
    pantsGrad.addColorStop(0, AVATAR_COLORS.CLARA_PANTS);
    pantsGrad.addColorStop(1, AVATAR_COLORS.CLARA_PANTS_SHADE);
    ctx.fillStyle = pantsGrad;
    ctx.beginPath();
    ctx.moveTo(-9.6, -4.5);
    ctx.lineTo(9.6, -4.5);
    ctx.quadraticCurveTo(10.5, 1.5, 9.4, 5.2);
    ctx.lineTo(-9.4, 5.2);
    ctx.quadraticCurveTo(-10.5, 1.5, -9.6, -4.5);
    ctx.closePath();
    ctx.fill();

    // Bras de Clara (avant-bras couleur peau du jour 8 + manches courtes du t-shirt jaune)
    ctx.strokeStyle = AVATAR_COLORS.CLARA_SKIN_SHADE;
    ctx.lineWidth = 4.6;
    ctx.beginPath();
    ctx.moveTo(-11, -26);
    ctx.quadraticCurveTo(-15, -14, -12.5, -3 + armSwing);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(11, -26);
    ctx.quadraticCurveTo(15, -14, 12.5, -3 - armSwing);
    ctx.stroke();

    // Manches courtes du t-shirt jaune
    ctx.strokeStyle = AVATAR_COLORS.CLARA_TSHIRT_MID;
    ctx.lineWidth = 5.6;
    ctx.beginPath();
    ctx.moveTo(-10.5, -26.5);
    ctx.lineTo(-13.4, -18.5 + armSwing * 0.25);
    ctx.moveTo(10.5, -26.5);
    ctx.lineTo(13.4, -18.5 - armSwing * 0.25);
    ctx.stroke();

    // T-SHIRT JAUNE DE CLARA (exactement sur la silhouette du jour 8)
    const shirtGrad = ctx.createLinearGradient(-11, -30, 11, -2);
    shirtGrad.addColorStop(0, AVATAR_COLORS.CLARA_TSHIRT_TOP);
    shirtGrad.addColorStop(0.58, AVATAR_COLORS.CLARA_TSHIRT_MID);
    shirtGrad.addColorStop(1, AVATAR_COLORS.CLARA_TSHIRT_SHADE);
    ctx.fillStyle = shirtGrad;

    ctx.beginPath();
    ctx.moveTo(-11.5, -28);
    ctx.quadraticCurveTo(0, -31, 11.5, -28);
    ctx.lineTo(9.4, -4);
    ctx.quadraticCurveTo(0, -2.5, -9.4, -4);
    ctx.closePath();
    ctx.fill();

    // Cou et Tête (exacts du jour 8)
    ctx.fillStyle = AVATAR_COLORS.CLARA_SKIN;
    ctx.fillRect(-3.2, -36, 6.4, 8);
    ctx.beginPath();
    ctx.arc(0, -43, 9.5, 0, Math.PI * 2);
    ctx.fill();

    // LONGS CHEVEUX BRUNS DE CLARA (EXACTEMENT LE CODE DU JOUR 8)
    const sway = hairSway;
    const hairGrad = ctx.createLinearGradient(0, -53, 0, -6);
    hairGrad.addColorStop(0, '#4B2E1B');
    hairGrad.addColorStop(0.5, '#382012');
    hairGrad.addColorStop(1, '#27150B');
    ctx.fillStyle = hairGrad;

    ctx.beginPath();
    ctx.arc(0, -44.5, 10.4, Math.PI * 0.85, Math.PI * 2.15);
    ctx.bezierCurveTo(12.5, -34, 13 + sway * 0.7, -18, 9.5 + sway, -8);
    ctx.quadraticCurveTo(4 + sway, -4, 0 + sway * 0.9, -6.5);
    ctx.quadraticCurveTo(-4 + sway, -4, -9.5 + sway, -8);
    ctx.bezierCurveTo(-13 + sway * 0.7, -18, -12.5, -34, -10.2, -43);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(120, 78, 48, 0.45)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(-4, -48);
    ctx.quadraticCurveTo(-6 + sway * 0.5, -26, -5 + sway, -10);
    ctx.moveTo(4, -48);
    ctx.quadraticCurveTo(6 + sway * 0.5, -26, 5 + sway, -10);
    ctx.stroke();

    ctx.restore();
}

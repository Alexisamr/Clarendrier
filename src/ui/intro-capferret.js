/**
 * ============================================================================
 * ANIMATION D'OUVERTURE CAP FERRET (UN SOIR D'ÉTÉ SUR LA DUNE)
 * ============================================================================
 * Appel facile à brancher plus tard (ex. à partir du jour 10) :
 *   import { lancerIntroCapFerret } from './intro-capferret.js';
 *   lancerIntroCapFerret({ onCovered, onComplete });
 *
 * Scène (~9.0s) :
 *   1. Alexis et Clara (strictement les mêmes avatars, tailles, vitesses et
 *      timing que l'animation montagne) marchent côte à côte sur la dune vers
 *      son bord, avec du sable fin soufflé légèrement par le vent.
 *   2. En atteignant le haut de la dune, la vue s'ouvre sur la plage en
 *      contrebas et l'océan au coucher du soleil (ciel bleu clair -> violet ->
 *      rose -> orange -> or, reflets dorés sur l'eau, petites vagues brillantes).
 *   3. À droite sur la plage en contrebas : un bunker de la Seconde Guerre
 *      mondiale en béton, à moitié enfoui dans le sable et légèrement penché,
 *      couvert de graffitis colorés (tags, formes street art, plusieurs cœurs).
 *   4. Dès l'apparition du coucher de soleil, une nuée légère d'oiseaux (~11)
 *      traverse lentement le ciel devant le soleil avec un doux battement d'ailes.
 *   5. Les deux avatars s'arrêtent au bord de la dune pour admirer la vue,
 *      puis fondu doré doux vers le vrai accueil du calendrier et retrait
 *      complet de l'élément du DOM.
 * ============================================================================
 */

import { clamp } from '../utils/helpers.js';
import { drawIntroAlexis, drawIntroClara } from './intro-avatars.js';

/* -------------------------------------------------------------------------
   TIMELINE & PARAMÈTRES FACILES À AJUSTER (en secondes)
   ------------------------------------------------------------------------- */
const CAPFERRET_CONFIG = {
    TOTAL_DURATION: 9.0,           // Légèrement plus longue pour profiter du coucher de soleil
    FADE_IN_END: 0.45,             // Fin du fondu d'entrée (callback onCovered)
    WALK_START: 0.40,              // Identique à l'animation montagne
    WALK_END: 3.55,                // Identique à l'animation montagne
    CREST_REVEAL_START: 0.70,      // Début d'ouverture de la vue sur la plage et l'océan
    CREST_REVEAL_END: 3.55,        // Vue pleinement ouverte quand ils atteignent le bord
    BIRDS_START: 1.75,             // Début de la traversée de la nuée devant le soleil
    BIRDS_END: 7.75,               // Fin de traversée douce
    FADE_OUT_START: 7.15,          // Début du fondu doux vers l'accueil du calendrier
    FADE_OUT_END: 8.85,            // Scène entièrement effacée
    PASS_THROUGH_AT: 7.90,         // Laisse passer les clics dès que l'accueil est visible
    VEIL_PEAK: 7.75,               // Doux voile doré de transition
    SAND_PARTICLE_COUNT: 48,
    SAND_WISP_COUNT: 9,
    BIRD_COUNT: 11
};

let activeCapFerretCleanup = null;

function easeOutCubic(t) {
    const p = clamp(t, 0, 1);
    return 1 - Math.pow(1 - p, 3);
}

function easeInOutCubic(t) {
    const p = clamp(t, 0, 1);
    return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
}

function smoothstep(edge0, edge1, x) {
    const t = clamp((x - edge0) / Math.max(0.0001, edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
}

/* -------------------------------------------------------------------------
   NUAGES DOUX DE SOIR D'ÉTÉ (SVG LÉGER SANS DÉCOUPE SUR MOBILE OU DESKTOP)
   ------------------------------------------------------------------------- */
function buildSunsetCloudsSvg() {
    return `
        <svg class="intro-cf-clouds-svg" viewBox="0 0 1000 320" preserveAspectRatio="none" aria-hidden="true">
            <defs>
                <linearGradient id="cfCloudRose" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stop-color="#F7B3B8" stop-opacity="0"/>
                    <stop offset="22%" stop-color="#FFE0C4" stop-opacity="0.52"/>
                    <stop offset="55%" stop-color="#F9B4A8" stop-opacity="0.48"/>
                    <stop offset="82%" stop-color="#E49AB2" stop-opacity="0.32"/>
                    <stop offset="100%" stop-color="#C887AE" stop-opacity="0"/>
                </linearGradient>
                <linearGradient id="cfCloudAmber" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stop-color="#FAD09A" stop-opacity="0"/>
                    <stop offset="25%" stop-color="#FFE7BA" stop-opacity="0.58"/>
                    <stop offset="60%" stop-color="#FBB685" stop-opacity="0.46"/>
                    <stop offset="85%" stop-color="#EC9490" stop-opacity="0.28"/>
                    <stop offset="100%" stop-color="#D9839E" stop-opacity="0"/>
                </linearGradient>
            </defs>
            <!-- Nuages étirés et fondus sur les bords (toujours organiques quel que soit le ratio d'écran) -->
            <ellipse cx="265" cy="94" rx="220" ry="22" fill="url(#cfCloudRose)"/>
            <ellipse cx="245" cy="84" rx="135" ry="16" fill="url(#cfCloudRose)" opacity="0.72"/>
            <ellipse cx="760" cy="78" rx="215" ry="20" fill="url(#cfCloudRose)" opacity="0.88"/>
            <ellipse cx="795" cy="68" rx="120" ry="14" fill="url(#cfCloudRose)" opacity="0.65"/>

            <ellipse cx="420" cy="176" rx="265" ry="24" fill="url(#cfCloudAmber)"/>
            <ellipse cx="385" cy="166" rx="150" ry="16" fill="url(#cfCloudAmber)" opacity="0.75"/>
            <ellipse cx="785" cy="186" rx="210" ry="18" fill="url(#cfCloudAmber)" opacity="0.82"/>
            <ellipse cx="195" cy="222" rx="175" ry="14" fill="url(#cfCloudAmber)" opacity="0.6"/>
        </svg>
    `;
}

/* -------------------------------------------------------------------------
   BUNKER DE LA SECONDE GUERRE MONDIALE (BÉTON, PENCHÉ, ENFOUI & GRAFFITIS)
   - Positionné à gauche de la plage en contrebas
   - Deux niveaux à toit plat : partie gauche plus basse, partie droite surélevée
   - Street art coloré lisible : tags stylisés, motifs, cœurs colorés
   ------------------------------------------------------------------------- */
function buildBunkerSvg() {
    return `
        <svg class="intro-cf-bunker-svg" viewBox="0 0 280 185" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <defs>
                <!-- Béton vieilli côté éclairé par le coucher du soleil -->
                <linearGradient id="cfBunkerFront" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#9B9792"/>
                    <stop offset="52%" stop-color="#7E7B79"/>
                    <stop offset="100%" stop-color="#5E5D60"/>
                </linearGradient>
                <!-- Toits plats en béton avec reflet chaud du soleil -->
                <linearGradient id="cfBunkerRoof" x1="0" y1="0" x2="1" y2="0.6">
                    <stop offset="0%" stop-color="#CDB9A4"/>
                    <stop offset="52%" stop-color="#ABA096"/>
                    <stop offset="100%" stop-color="#87807C"/>
                </linearGradient>
                <!-- Flanc latéral droit ombré -->
                <linearGradient id="cfBunkerSide" x1="0" y1="0" x2="0.8" y2="1">
                    <stop offset="0%" stop-color="#6B686C"/>
                    <stop offset="100%" stop-color="#48474D"/>
                </linearGradient>
                <!-- Sable de la plage qui enfouit à moitié le bunker (fondu doux sans bord rectangulaire) -->
                <linearGradient id="cfBunkerSand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#E6BA86" stop-opacity="1"/>
                    <stop offset="48%" stop-color="#DFB07B" stop-opacity="0.96"/>
                    <stop offset="82%" stop-color="#DDA974" stop-opacity="0.52"/>
                    <stop offset="100%" stop-color="#DDA974" stop-opacity="0"/>
                </linearGradient>
                <linearGradient id="cfBunkerSandLight" x1="0" y1="0" x2="1" y2="0.4">
                    <stop offset="0%" stop-color="#F3CD98" stop-opacity="0"/>
                    <stop offset="28%" stop-color="#F3CD98" stop-opacity="0.62"/>
                    <stop offset="72%" stop-color="#E6BA86" stop-opacity="0.34"/>
                    <stop offset="100%" stop-color="#DFB07B" stop-opacity="0"/>
                </linearGradient>
                <!-- Clip façade principale à deux niveaux (gauche bas + droite surélevée) -->
                <clipPath id="cfBunkerFaceClip">
                    <polygon points="28,66 142,66 142,40 212,40 212,144 28,144"/>
                </clipPath>
                <clipPath id="cfBunkerSideClip">
                    <polygon points="212,40 244,28 244,132 212,144"/>
                </clipPath>
            </defs>

            <!-- Ombre douce projetée sur la plage -->
            <ellipse cx="144" cy="155" rx="116" ry="20" fill="#5A3A42" opacity="0.28"/>

            <!-- Corps du bunker penché (~6.5 deg) et partiellement enfoncé dans le sable -->
            <g transform="rotate(-6.5 142 115)">
                <!-- Toit plat de la partie gauche (plus bas) -->
                <polygon points="28,66 58,54 142,54 142,66" fill="url(#cfBunkerRoof)" stroke="#625C58" stroke-width="1.2" stroke-linejoin="round"/>
                <line x1="29" y1="65" x2="141" y2="65" stroke="#E4CEB6" stroke-width="1.4" opacity="0.62"/>

                <!-- Toit plat de la partie droite (surélevée) -->
                <polygon points="142,40 174,28 244,28 212,40" fill="url(#cfBunkerRoof)" stroke="#625C58" stroke-width="1.2" stroke-linejoin="round"/>
                <line x1="143" y1="39" x2="211" y2="39" stroke="#E8D2BA" stroke-width="1.5" opacity="0.68"/>

                <!-- Façade principale en béton à deux hauteurs (toit plat gauche + partie surélevée droite) -->
                <polygon points="28,66 142,66 142,40 212,40 212,144 28,144" fill="url(#cfBunkerFront)" stroke="#555357" stroke-width="1.2" stroke-linejoin="round"/>

                <!-- Légère démarcation architecturale entre la partie basse gauche et le bloc surélevé droit -->
                <line x1="142" y1="66" x2="142" y2="143" stroke="#5B585C" stroke-width="1.1" opacity="0.48"/>
                <line x1="143.5" y1="41" x2="143.5" y2="143" stroke="#BDB4AA" stroke-width="0.9" opacity="0.28"/>

                <!-- Flanc droit en perspective (montant jusqu'au toit plat surélevé) -->
                <polygon points="212,40 244,28 244,132 212,144" fill="url(#cfBunkerSide)" stroke="#48464C" stroke-width="1.1" stroke-linejoin="round"/>

                <!-- Texture de béton, joints de coffrage & fissures subtiles -->
                <g stroke="#4E4C50" stroke-width="0.9" opacity="0.34" fill="none">
                    <line x1="29" y1="92" x2="211" y2="92"/>
                    <line x1="29" y1="118" x2="211" y2="118"/>
                    <line x1="143" y1="66" x2="211" y2="66"/>
                    <path d="M 56 67 L 60 80 L 54 90"/>
                    <path d="M 164 41 L 160 56 L 165 68"/>
                    <path d="M 226 36 L 222 64 L 229 82"/>
                </g>

                <!-- === GRAFFITIS STREET ART COLORÉS SUR TOUTE LA FAÇADE === -->
                <g clip-path="url(#cfBunkerFaceClip)">
                    <!-- Halos de bombe peinture en fond (couvrant le bloc gauche et le bloc surélevé droit) -->
                    <ellipse cx="64" cy="118" rx="30" ry="20" fill="#2DD4BF" opacity="0.32"/>
                    <ellipse cx="94" cy="84" rx="36" ry="18" fill="#A78BFA" opacity="0.30"/>
                    <ellipse cx="122" cy="118" rx="34" ry="20" fill="#FF6B8B" opacity="0.30"/>
                    <ellipse cx="176" cy="58" rx="26" ry="16" fill="#38BDF8" opacity="0.30"/>
                    <ellipse cx="176" cy="106" rx="28" ry="24" fill="#FACC15" opacity="0.28"/>

                    <!-- Grand graffiti coloré en haut de la partie gauche (à la place de l'ancienne ouverture) -->
                    <path d="M 46 94 C 52 75, 68 74, 74 88 C 80 73, 98 74, 102 90 C 109 75, 126 76, 134 91"
                          fill="none" stroke="#1E1B2E" stroke-width="9.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.82"/>
                    <path d="M 46 94 C 52 75, 68 74, 74 88 C 80 73, 98 74, 102 90 C 109 75, 126 76, 134 91"
                          fill="none" stroke="#F472B6" stroke-width="6.2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M 48 91 C 54 77, 67 76, 73 86 C 80 75, 96 76, 101 87"
                          fill="none" stroke="#FEF08A" stroke-width="2.1" stroke-linecap="round"/>

                    <!-- Graffiti coloré en haut de la partie surélevée droite (à la place de la petite ouverture) -->
                    <path d="M 150 61 Q 162 45 174 58 Q 186 44 203 57"
                          fill="none" stroke="#1E1B2E" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" opacity="0.78"/>
                    <path d="M 150 61 Q 162 45 174 58 Q 186 44 203 57"
                          fill="none" stroke="#34D399" stroke-width="4.8" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M 152 59 Q 162 47 173 56"
                          fill="none" stroke="#FFFBEB" stroke-width="1.6" stroke-linecap="round"/>

                    <!-- Tag coloré style wildstyle abstrait en bas : vague + ruban turquoise/jaune -->
                    <path d="M 38 127 C 48 104, 66 102, 74 121 C 82 136, 98 106, 114 111 C 128 116, 138 134, 156 114"
                          fill="none" stroke="#1E1B2E" stroke-width="8.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.78"/>
                    <path d="M 38 127 C 48 104, 66 102, 74 121 C 82 136, 98 106, 114 111 C 128 116, 138 134, 156 114"
                          fill="none" stroke="#38BDF8" stroke-width="5.2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M 40 125 C 50 106, 64 105, 72 120"
                          fill="none" stroke="#FEF08A" stroke-width="2" stroke-linecap="round"/>

                    <!-- Motifs graphiques street art : couronne + ruban orange sur le bloc surélevé -->
                    <path d="M 34 78 L 38 69 L 43 75 L 48 68 L 52 78 Z" fill="#FACC15" stroke="#2D1E2F" stroke-width="1.1" stroke-linejoin="round"/>
                    <path d="M 154 78 Q 174 69 193 79 Q 174 88 159 94 Q 178 98 200 89"
                          fill="none" stroke="#FB923C" stroke-width="4" stroke-linecap="round"/>
                    <path d="M 154 78 Q 174 69 193 79"
                          fill="none" stroke="#FFFBEB" stroke-width="1.4" stroke-linecap="round"/>

                    <!-- Étoiles street art colorées -->
                    <path d="M 42 103 L 44.5 97 L 47 103 L 53 105 L 47 107 L 44.5 113 L 42 107 L 36 105 Z"
                          fill="#A78BFA" stroke="#FFF7ED" stroke-width="0.9"/>
                    <path d="M 196 47 L 198 42 L 200 47 L 205 49 L 200 51 L 198 56 L 196 51 L 191 49 Z"
                          fill="#FDE047" stroke="#2D1E2F" stroke-width="0.8"/>

                    <!-- Petit cœur corail sur la partie haute du bloc droit surélevé -->
                    <g transform="translate(175 56) rotate(8) scale(0.56)">
                        <path d="M 0 10 C -13 1, -15 -10, -6 -11 C -2 -11.5, 0 -7, 0 -5.5 C 0 -7, 2 -11.5, 6 -11 C 15 -10, 13 1, 0 10 Z"
                              fill="#FF5C8A" stroke="#FFFDF7" stroke-width="2.2" stroke-linejoin="round"/>
                    </g>

                    <!-- Petit cœur violet pastel en haut de la partie gauche -->
                    <g transform="translate(90 83) rotate(-10) scale(0.58)">
                        <path d="M 0 10 C -13 1, -15 -10, -6 -11 C -2 -11.5, 0 -7, 0 -5.5 C 0 -7, 2 -11.5, 6 -11 C 15 -10, 13 1, 0 10 Z"
                              fill="#C084FC" stroke="#FFFDF7" stroke-width="2.2" stroke-linejoin="round"/>
                    </g>

                    <!-- Grand cœur street art corail/rose avec contour blanc et petit reflet -->
                    <g transform="translate(115 116) rotate(-8)">
                        <path d="M 0 11 C -15 1, -17 -11, -7 -12 C -2 -12.5, 0 -7.5, 0 -6 C 0 -7.5, 2 -12.5, 7 -12 C 17 -11, 15 1, 0 11 Z"
                              fill="#FF5C8A" stroke="#FFFDF7" stroke-width="2.1" stroke-linejoin="round"/>
                        <path d="M -8 -7 C -9 -4, -7 -2, -5 -1" fill="none" stroke="#FFE4EE" stroke-width="1.6" stroke-linecap="round"/>
                    </g>

                    <!-- Cœur jaune soleil sur la partie droite -->
                    <g transform="translate(182 114) rotate(10) scale(0.82)">
                        <path d="M 0 10 C -13 1, -15 -10, -6 -11 C -2 -11.5, 0 -7, 0 -5.5 C 0 -7, 2 -11.5, 6 -11 C 15 -10, 13 1, 0 10 Z"
                              fill="#FDE047" stroke="#2D1E2F" stroke-width="2" stroke-linejoin="round"/>
                    </g>

                    <!-- Petit cœur menthe turquoise près du côté gauche -->
                    <g transform="translate(74 109) rotate(-14) scale(0.56)">
                        <path d="M 0 10 C -13 1, -15 -10, -6 -11 C -2 -11.5, 0 -7, 0 -5.5 C 0 -7, 2 -11.5, 6 -11 C 15 -10, 13 1, 0 10 Z"
                              fill="#34D399" stroke="#FFFDF7" stroke-width="2.2" stroke-linejoin="round"/>
                    </g>

                    <!-- Petites éclaboussures & coulures de peinture -->
                    <circle cx="62" cy="76" r="2.1" fill="#38BDF8"/>
                    <circle cx="114" cy="76" r="2.2" fill="#FDE047"/>
                    <circle cx="152" cy="48" r="2" fill="#F472B6"/>
                    <circle cx="94" cy="103" r="2.2" fill="#FDE047"/>
                    <circle cx="139" cy="106" r="2.1" fill="#38BDF8"/>
                    <circle cx="162" cy="102" r="2" fill="#FF5C8A"/>
                    <circle cx="201" cy="70" r="2" fill="#34D399"/>
                    <circle cx="62" cy="130" r="2" fill="#FB923C"/>
                    <line x1="68" y1="88" x2="67" y2="98" stroke="#F472B6" stroke-width="1.5" stroke-linecap="round"/>
                    <line x1="162" y1="58" x2="161" y2="67" stroke="#34D399" stroke-width="1.4" stroke-linecap="round"/>
                    <line x1="74" y1="121" x2="73" y2="132" stroke="#38BDF8" stroke-width="1.5" stroke-linecap="round"/>
                    <line x1="115" y1="127" x2="114" y2="136" stroke="#FF5C8A" stroke-width="1.6" stroke-linecap="round"/>
                </g>

                <!-- === GRAFFITIS COLORÉS SUR LE FLANC DROIT === -->
                <g clip-path="url(#cfBunkerSideClip)">
                    <path d="M 216 94 Q 228 76 240 90 Q 230 110 218 106"
                          fill="#F472B6" stroke="#271F30" stroke-width="2.1" opacity="0.88"/>
                    <path d="M 218 64 Q 230 56 241 68"
                          fill="none" stroke="#2DD4BF" stroke-width="3.8" stroke-linecap="round"/>
                    <g transform="translate(229 102) rotate(9) scale(0.58)">
                        <path d="M 0 10 C -13 1, -15 -10, -6 -11 C -2 -11.5, 0 -7, 0 -5.5 C 0 -7, 2 -11.5, 6 -11 C 15 -10, 13 1, 0 10 Z"
                              fill="#FB923C" stroke="#FFFDF7" stroke-width="2.2" stroke-linejoin="round"/>
                    </g>
                    <circle cx="235" cy="80" r="2.1" fill="#FDE047"/>
                </g>
            </g>

            <!-- Congères de sable doré qui enfouissent la base du bunker et se fondent dans la plage -->
            <path d="M 4 162 Q 46 126 112 138 Q 168 148 214 134 Q 250 124 276 158 Q 238 178 142 178 Q 48 178 4 162 Z" fill="url(#cfBunkerSand)"/>
            <path d="M 18 156 Q 68 134 128 144 Q 182 153 238 138 Q 258 144 266 158 Q 204 166 138 164 Q 70 165 18 156 Z" fill="url(#cfBunkerSandLight)"/>
            <!-- Petites touffes d'herbe sèche au pied du bunker -->
            <g stroke="#7A7C4A" stroke-width="1.6" stroke-linecap="round" fill="none" opacity="0.72">
                <path d="M 38 145 Q 34 134 30 129"/>
                <path d="M 41 145 Q 42 135 46 130"/>
                <path d="M 228 141 Q 232 131 237 127"/>
                <path d="M 225 142 Q 223 133 219 130"/>
            </g>
        </svg>
    `;
}

/* -------------------------------------------------------------------------
   DESSIN DE LA SCÈNE : OCÉAN, SOLEIL, VAGUES, OISEAUX, DUNE & SABLE AU VENT
   ------------------------------------------------------------------------- */
function drawSunAndOcean(ctx, width, height, horizonY, beachLineY, crestCenterY, sunX, sunY, sunRadius, elapsed, revealEase) {
    // 1. Halo atmosphérique du soleil couchant
    const outerHalo = ctx.createRadialGradient(sunX, sunY, sunRadius * 0.25, sunX, sunY, sunRadius * 5.8);
    outerHalo.addColorStop(0, 'rgba(255, 250, 224, 0.92)');
    outerHalo.addColorStop(0.22, 'rgba(255, 214, 138, 0.56)');
    outerHalo.addColorStop(0.55, 'rgba(246, 148, 108, 0.22)');
    outerHalo.addColorStop(1, 'rgba(246, 148, 108, 0)');
    ctx.fillStyle = outerHalo;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius * 5.8, 0, Math.PI * 2);
    ctx.fill();

    // 2. Disque solaire chaud coupé proprement à la ligne d'horizon
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, width, horizonY + 1);
    ctx.clip();

    const sunGrad = ctx.createLinearGradient(sunX, sunY - sunRadius, sunX, sunY + sunRadius);
    sunGrad.addColorStop(0, '#FFFDF0');
    sunGrad.addColorStop(0.55, '#FFE49E');
    sunGrad.addColorStop(1, '#FFB76B');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. Océan Atlantique avec dégradé crépusculaire doux
    const seaGrad = ctx.createLinearGradient(0, horizonY, 0, beachLineY + 26);
    seaGrad.addColorStop(0, '#D98C7C');
    seaGrad.addColorStop(0.18, '#A9779A');
    seaGrad.addColorStop(0.52, '#5F6E9B');
    seaGrad.addColorStop(0.84, '#4B6B8E');
    seaGrad.addColorStop(1, '#7CA1AE');
    ctx.fillStyle = seaGrad;
    ctx.fillRect(0, horizonY, width, beachLineY - horizonY + 30);

    // 4. Lueur dorée diffuse reflétée sur l'eau sous le soleil
    const waterGlow = ctx.createRadialGradient(
        sunX,
        horizonY + 8,
        sunRadius * 0.3,
        sunX,
        horizonY + (beachLineY - horizonY) * 0.45,
        Math.max(width * 0.32, sunRadius * 4.5)
    );
    waterGlow.addColorStop(0, 'rgba(255, 228, 156, 0.65)');
    waterGlow.addColorStop(0.45, 'rgba(248, 168, 114, 0.28)');
    waterGlow.addColorStop(1, 'rgba(248, 168, 114, 0)');
    ctx.fillStyle = waterGlow;
    ctx.fillRect(0, horizonY, width, beachLineY - horizonY + 10);

    // 5. Reflets dorés scintillants (chemin de lumière animé sur la mer)
    const seaDepth = Math.max(24, beachLineY - horizonY);
    const shimmerRows = 22;
    for (let i = 0; i < shimmerRows; i++) {
        const t = i / (shimmerRows - 1);
        const ry = horizonY + 3 + Math.pow(t, 1.38) * (seaDepth - 12);
        const spread = sunRadius * (0.65 + t * 2.35);
        const waveDrift = Math.sin(elapsed * (1.7 + (i % 4) * 0.35) + i * 1.45) * (5 + t * 14);
        const segW = Math.max(12, spread * (0.45 + 0.32 * Math.sin(elapsed * 2.2 + i * 2.1)));
        const segH = 1.3 + t * 2.2;
        const alpha = (0.76 - t * 0.42) * (0.68 + 0.32 * Math.sin(elapsed * 3.1 + i * 1.7));

        ctx.fillStyle = t < 0.35 ? `rgba(255, 246, 206, ${alpha.toFixed(3)})` : `rgba(255, 212, 138, ${alpha.toFixed(3)})`;
        ctx.fillRect(sunX - segW * 0.5 + waveDrift, ry, segW, segH);

        // Petits éclats secondaires sur les côtés du chemin doré
        if (i % 2 === 0) {
            const sideSign = i % 4 === 0 ? 1 : -1;
            const sideX = sunX + sideSign * (spread * 0.58 + Math.sin(elapsed * 1.9 + i) * 10);
            ctx.fillStyle = `rgba(255, 224, 166, ${(alpha * 0.55).toFixed(3)})`;
            ctx.fillRect(sideX - segW * 0.18, ry + 1, segW * 0.36, segH * 0.85);
        }
    }

    // 6. Petites vagues lumineuses horizontales qui glissent vers le rivage
    ctx.save();
    for (let w = 0; w < 5; w++) {
        const waveCycle = (elapsed * 0.14 + w / 5) % 1;
        const wy = horizonY + seaDepth * (0.34 + waveCycle * 0.64);
        const waveAlpha = Math.sin(waveCycle * Math.PI) * 0.42;
        ctx.strokeStyle = `rgba(255, 240, 214, ${waveAlpha.toFixed(3)})`;
        ctx.lineWidth = 1.1 + waveCycle * 1.2;
        ctx.beginPath();
        const steps = 18;
        for (let s = 0; s <= steps; s++) {
            const sx = (s / steps) * width;
            const sy = wy + Math.sin(s * 0.85 + elapsed * 1.4 + w * 2.3) * (1.8 + waveCycle * 2.2);
            if (s === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
        }
        ctx.stroke();
    }
    ctx.restore();

    // 7. Plage en contrebas (sable doré rosé + liseré d'écume brillante)
    const surfOffset = Math.sin(elapsed * 1.55) * 3.5;
    const beachGrad = ctx.createLinearGradient(0, beachLineY - 6, 0, height);
    beachGrad.addColorStop(0, '#CFA084'); // Sable mouillé qui reflète le rose du ciel
    beachGrad.addColorStop(0.16, '#E2B484');
    beachGrad.addColorStop(0.55, '#DFB07B');
    beachGrad.addColorStop(1, '#C5905E');

    ctx.fillStyle = beachGrad;
    ctx.beginPath();
    ctx.moveTo(0, beachLineY + surfOffset);
    ctx.bezierCurveTo(
        width * 0.28, beachLineY - 12 + surfOffset * 0.7,
        width * 0.65, beachLineY + 14 - surfOffset * 0.6,
        width, beachLineY - 8 + surfOffset
    );
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    // 7b. Chemin de sable plus foncé qui descend de la crête vers la plage
    if (revealEase > 0.08 && crestCenterY > beachLineY + 14) {
        const pathAlpha = smoothstep(0.08, 0.45, revealEase);
        const startX = width * 0.50;
        const startY = getDuneCrestY(startX, width, crestCenterY) + 10;
        const beachSpan = Math.max(18, startY - beachLineY);
        const crestHalfW = clamp(width * 0.082, 30, 52);

        ctx.save();
        ctx.globalAlpha = pathAlpha;

        // Dégradé doux du chemin descendant sur la plage (un peu plus foncé que le sable clair, s'estompe près de l'eau)
        const beachPathGrad = ctx.createLinearGradient(startX, startY, width * 0.56, beachLineY + 8);
        beachPathGrad.addColorStop(0, 'rgba(154, 100, 62, 0.72)');
        beachPathGrad.addColorStop(0.52, 'rgba(166, 112, 72, 0.54)');
        beachPathGrad.addColorStop(0.84, 'rgba(174, 120, 80, 0.28)');
        beachPathGrad.addColorStop(1, 'rgba(174, 120, 80, 0)');

        // Chemin principal : descend de la dune et serpente vers la plage / l'océan
        const midX = width * 0.53;
        const midY = startY - beachSpan * 0.46;
        const endX = width * 0.61;
        const endY = beachLineY + Math.min(18, beachSpan * 0.16);
        const endHalfW = crestHalfW * 0.42;

        ctx.fillStyle = beachPathGrad;
        ctx.beginPath();
        ctx.moveTo(startX - crestHalfW * 0.92, startY);
        ctx.bezierCurveTo(
            startX - crestHalfW * 0.75, startY - beachSpan * 0.34,
            midX - crestHalfW * 0.62, midY - beachSpan * 0.14,
            endX - endHalfW, endY
        );
        ctx.lineTo(endX + endHalfW, endY + 2);
        ctx.bezierCurveTo(
            midX + crestHalfW * 0.72, midY - beachSpan * 0.04,
            startX + crestHalfW * 0.98, startY - beachSpan * 0.28,
            startX + crestHalfW * 0.92, startY
        );
        ctx.closePath();
        ctx.fill();

        // Doux sillon central pour un effet sable tassé naturel
        const innerBeachGrad = ctx.createLinearGradient(startX, startY, endX, endY);
        innerBeachGrad.addColorStop(0, 'rgba(134, 84, 50, 0.36)');
        innerBeachGrad.addColorStop(0.65, 'rgba(148, 96, 60, 0.22)');
        innerBeachGrad.addColorStop(1, 'rgba(148, 96, 60, 0)');
        ctx.strokeStyle = innerBeachGrad;
        ctx.lineWidth = crestHalfW * 0.68;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(midX, midY, endX, endY + 4);
        ctx.stroke();

        ctx.restore();
    }

    // Reflet doré sur le sable humide près de l'eau
    const wetGlow = ctx.createLinearGradient(sunX - width * 0.28, beachLineY, sunX + width * 0.28, beachLineY + 26);
    wetGlow.addColorStop(0, 'rgba(255, 214, 152, 0)');
    wetGlow.addColorStop(0.5, 'rgba(255, 224, 166, 0.34)');
    wetGlow.addColorStop(1, 'rgba(255, 214, 152, 0)');
    ctx.fillStyle = wetGlow;
    ctx.fillRect(0, beachLineY - 12, width, 38);

    // Fin ruban d'écume blanche/dorée qui brille doucement au bord de la plage
    ctx.save();
    ctx.strokeStyle = `rgba(255, 248, 232, ${(0.55 + 0.18 * Math.sin(elapsed * 2.1)).toFixed(3)})`;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(0, beachLineY + surfOffset);
    ctx.bezierCurveTo(
        width * 0.28, beachLineY - 12 + surfOffset * 0.7,
        width * 0.65, beachLineY + 14 - surfOffset * 0.6,
        width, beachLineY - 8 + surfOffset
    );
    ctx.stroke();

    // Seconde vaguelette d'écume juste derrière
    ctx.strokeStyle = `rgba(255, 238, 206, ${(0.34 * revealEase).toFixed(3)})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, beachLineY - 9 - surfOffset * 0.6);
    ctx.bezierCurveTo(
        width * 0.30, beachLineY - 18 - surfOffset * 0.4,
        width * 0.66, beachLineY + 4 + surfOffset * 0.5,
        width, beachLineY - 16 - surfOffset * 0.5
    );
    ctx.stroke();
    ctx.restore();
}

function drawBirdFlock(ctx, width, sunX, sunY, sunRadius, birds, elapsed) {
    if (elapsed < CAPFERRET_CONFIG.BIRDS_START || elapsed > CAPFERRET_CONFIG.BIRDS_END) return;

    const flockProgress = clamp(
        (elapsed - CAPFERRET_CONFIG.BIRDS_START) / (CAPFERRET_CONFIG.BIRDS_END - CAPFERRET_CONFIG.BIRDS_START),
        0,
        1
    );
    const flockFade =
        smoothstep(0, 0.12, flockProgress) *
        (1 - smoothstep(0.86, 1, flockProgress));

    if (flockFade <= 0.01) return;

    // Trajectoire douce qui passe pile devant le soleil couchant au loin
    const startX = sunX - Math.max(width * 0.44, sunRadius * 5.2);
    const endX = sunX + Math.max(width * 0.52, sunRadius * 6.0);
    const leaderX = startX + (endX - startX) * flockProgress;
    const leaderY = sunY + sunRadius * 0.25 - flockProgress * sunRadius * 1.15;

    ctx.save();
    for (let i = 0; i < birds.length; i++) {
        const b = birds[i];
        const bx = leaderX + b.dx * sunRadius;
        const by = leaderY + b.dy * sunRadius + Math.sin(elapsed * 1.35 + b.phase) * 3.5;

        // Battement d'ailes léger et naturel (avec courtes phases planées)
        const flapCycle = Math.sin(elapsed * b.wingSpeed + b.phase);
        const wingLift = flapCycle * 0.55 + 0.12;
        const span = b.size * clamp(width / 900, 0.78, 1.18);

        // Silhouette légèrement plus contrastée lorsqu'elle passe directement devant le disque solaire
        const distSun = Math.hypot(bx - sunX, by - sunY);
        const inFrontOfSun = distSun < sunRadius * 1.45;
        ctx.strokeStyle = inFrontOfSun ? '#4A2B36' : '#5E3B4A';
        ctx.globalAlpha = flockFade * (inFrontOfSun ? 0.90 : 0.72);
        ctx.lineWidth = Math.max(1.2, span * 0.16);
        ctx.lineCap = 'round';

        ctx.beginPath();
        // Aile gauche
        ctx.moveTo(bx - span, by - span * wingLift * 0.65);
        ctx.quadraticCurveTo(
            bx - span * 0.45,
            by - span * (0.38 + wingLift * 0.45),
            bx,
            by
        );
        // Aile droite
        ctx.quadraticCurveTo(
            bx + span * 0.45,
            by - span * (0.38 + wingLift * 0.45),
            bx + span,
            by - span * wingLift * 0.65
        );
        ctx.stroke();
    }
    ctx.restore();
}

function getDuneCrestY(x, width, crestCenterY) {
    // Courbe douce de crête de dune : descend légèrement à gauche
    // pour offrir une vue dégagée sur le bunker tagué sur la plage en contrebas
    const nx = x / Math.max(1, width);
    const leftDip = Math.pow(Math.max(0, 0.46 - nx), 1.45) * 68;
    const centerSwell = Math.sin(nx * Math.PI) * -10;
    const rightLift = Math.pow(Math.max(0, nx - 0.55), 1.6) * 52;
    return crestCenterY + leftDip + centerSwell - rightLift;
}

function drawDuneAndGrass(ctx, width, height, crestCenterY, elapsed) {
    // 1. Dune principale au premier plan (sable doré chaud du Cap Ferret)
    const duneGrad = ctx.createLinearGradient(0, crestCenterY - 25, 0, height);
    duneGrad.addColorStop(0, '#F1C68D');
    duneGrad.addColorStop(0.24, '#DFAC72');
    duneGrad.addColorStop(0.66, '#C48C59');
    duneGrad.addColorStop(1, '#9E6945');

    ctx.fillStyle = duneGrad;
    ctx.beginPath();
    ctx.moveTo(0, height);
    const samples = 24;
    for (let i = 0; i <= samples; i++) {
        const sx = (i / samples) * width;
        const sy = getDuneCrestY(sx, width, crestCenterY);
        ctx.lineTo(sx, sy);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();

    // 1b. Petit chemin de sable légèrement plus foncé sur la dune (là où marchent Alexis & Clara)
    ctx.save();
    // Clip sous la crête de la dune pour une jonction parfaitement nette avec la descente vers la plage
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let i = 0; i <= samples; i++) {
        const sx = (i / samples) * width;
        const sy = getDuneCrestY(sx, width, crestCenterY);
        ctx.lineTo(sx, sy);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.clip();

    const centerX = width * 0.50;
    const crestAtCenter = getDuneCrestY(centerX, width, crestCenterY);
    const duneHeight = Math.max(40, height - crestAtCenter);
    const topHalfW = clamp(width * 0.082, 30, 52);
    const bottomHalfW = clamp(width * 0.165, 64, 124);

    // Bord adouci du chemin (transition naturelle dans le sable clair de la dune)
    const dunePathOuterGrad = ctx.createLinearGradient(0, crestAtCenter, 0, height);
    dunePathOuterGrad.addColorStop(0, 'rgba(176, 120, 74, 0.52)');
    dunePathOuterGrad.addColorStop(0.35, 'rgba(154, 100, 60, 0.56)');
    dunePathOuterGrad.addColorStop(1, 'rgba(122, 74, 44, 0.62)');

    ctx.fillStyle = dunePathOuterGrad;
    ctx.beginPath();
    ctx.moveTo(centerX - bottomHalfW * 1.14, height + 6);
    ctx.bezierCurveTo(
        centerX - bottomHalfW * 0.96 - 6, crestAtCenter + duneHeight * 0.66,
        centerX - topHalfW * 1.38 + 5, crestAtCenter + duneHeight * 0.30,
        centerX - topHalfW * 1.12, crestAtCenter - 4
    );
    ctx.lineTo(centerX + topHalfW * 1.12, crestAtCenter - 4);
    ctx.bezierCurveTo(
        centerX + topHalfW * 1.38 + 5, crestAtCenter + duneHeight * 0.30,
        centerX + bottomHalfW * 0.96 - 6, crestAtCenter + duneHeight * 0.66,
        centerX + bottomHalfW * 1.14, height + 6
    );
    ctx.closePath();
    ctx.fill();

    // Cœur du chemin en sable tassé plus foncé (sous les pas d'Alexis & Clara)
    const dunePathGrad = ctx.createLinearGradient(0, crestAtCenter, 0, height);
    dunePathGrad.addColorStop(0, '#C58B58');
    dunePathGrad.addColorStop(0.32, '#B07546');
    dunePathGrad.addColorStop(0.72, '#986039');
    dunePathGrad.addColorStop(1, '#7D4D2E');

    ctx.fillStyle = dunePathGrad;
    ctx.beginPath();
    ctx.moveTo(centerX - bottomHalfW, height + 6);
    ctx.bezierCurveTo(
        centerX - bottomHalfW * 0.84 - 5, crestAtCenter + duneHeight * 0.66,
        centerX - topHalfW * 1.22 + 4, crestAtCenter + duneHeight * 0.30,
        centerX - topHalfW, crestAtCenter - 4
    );
    ctx.lineTo(centerX + topHalfW, crestAtCenter - 4);
    ctx.bezierCurveTo(
        centerX + topHalfW * 1.22 + 4, crestAtCenter + duneHeight * 0.30,
        centerX + bottomHalfW * 0.84 - 5, crestAtCenter + duneHeight * 0.66,
        centerX + bottomHalfW, height + 6
    );
    ctx.closePath();
    ctx.fill();

    // Légers rebords lumineux de sable soulevé de chaque côté du chemin
    ctx.strokeStyle = 'rgba(255, 228, 184, 0.28)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(centerX - bottomHalfW * 1.03, height + 4);
    ctx.bezierCurveTo(
        centerX - bottomHalfW * 0.87 - 5, crestAtCenter + duneHeight * 0.66,
        centerX - topHalfW * 1.25 + 4, crestAtCenter + duneHeight * 0.30,
        centerX - topHalfW * 1.03, crestAtCenter
    );
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(centerX + bottomHalfW * 1.03, height + 4);
    ctx.bezierCurveTo(
        centerX + bottomHalfW * 0.87 - 5, crestAtCenter + duneHeight * 0.66,
        centerX + topHalfW * 1.25 + 4, crestAtCenter + duneHeight * 0.30,
        centerX + topHalfW * 1.03, crestAtCenter
    );
    ctx.stroke();
    ctx.restore();

    // 2. Liséré de lumière dorée du coucher de soleil sur la crête de la dune
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 238, 198, 0.62)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let i = 0; i <= samples; i++) {
        const sx = (i / samples) * width;
        const sy = getDuneCrestY(sx, width, crestCenterY) + 1;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
    }
    ctx.stroke();

    // 3. Ondulations douces du sable sur la pente de la dune
    ctx.strokeStyle = 'rgba(138, 86, 52, 0.16)';
    ctx.lineWidth = 1.6;
    for (let r = 0; r < 4; r++) {
        const depthOffset = 28 + r * 38;
        ctx.beginPath();
        for (let i = 0; i <= 14; i++) {
            const sx = (i / 14) * width;
            const baseY = getDuneCrestY(sx, width, crestCenterY) + depthOffset;
            const ripple = Math.sin(i * 0.9 + r * 1.7) * 5;
            if (i === 0) ctx.moveTo(sx, baseY + ripple);
            else ctx.lineTo(sx, baseY + ripple);
        }
        ctx.stroke();
    }

    // 4. Touffes d'oyats (herbes de dune) sur les bords gauche/droite qui bougent doucement au vent
    const grassClusters = [
        { nx: 0.06, scale: 0.92, blades: 6 },
        { nx: 0.14, scale: 0.68, blades: 5 },
        { nx: 0.78, scale: 0.70, blades: 5 },
        { nx: 0.87, scale: 0.88, blades: 6 },
        { nx: 0.95, scale: 1.05, blades: 7 }
    ];

    for (let c = 0; c < grassClusters.length; c++) {
        const cl = grassClusters[c];
        const gx = cl.nx * width;
        const gy = getDuneCrestY(gx, width, crestCenterY) + 10;
        const wind = Math.sin(elapsed * 2.2 + c * 1.3) * 6 + 5;

        for (let b = 0; b < cl.blades; b++) {
            const spread = (b / (cl.blades - 1) - 0.5) * 26 * cl.scale;
            const bladeH = (22 + (b % 3) * 11) * cl.scale;
            ctx.strokeStyle = b % 2 === 0 ? 'rgba(104, 102, 58, 0.78)' : 'rgba(138, 128, 76, 0.68)';
            ctx.lineWidth = 1.6 * cl.scale;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(gx + spread * 0.25, gy);
            ctx.quadraticCurveTo(
                gx + spread * 0.65 + wind * 0.45,
                gy - bladeH * 0.55,
                gx + spread + wind,
                gy - bladeH
            );
            ctx.stroke();
        }
    }
    ctx.restore();
}

function drawWindBlownSand(ctx, width, height, crestCenterY, sandParticles, sandWisps, dt, elapsed) {
    ctx.save();

    // 1. Légers voiles de sable rasants soufflés par la brise sur la dune
    for (let i = 0; i < sandWisps.length; i++) {
        const w = sandWisps[i];
        w.x += w.vx * dt;
        if (w.x - w.len > width + 40) {
            w.x = -w.len - Math.random() * 80;
            w.offsetFromCrest = 4 + Math.random() * (height * 0.22);
        }
        const crestAtX = getDuneCrestY(clamp(w.x, 0, width), width, crestCenterY);
        const wy = crestAtX + w.offsetFromCrest + Math.sin(elapsed * 1.8 + w.phase) * 4;

        const wGrad = ctx.createLinearGradient(w.x - w.len, wy, w.x, wy - 4);
        wGrad.addColorStop(0, 'rgba(255, 232, 190, 0)');
        wGrad.addColorStop(0.5, `rgba(255, 230, 186, ${w.alpha.toFixed(3)})`);
        wGrad.addColorStop(1, 'rgba(255, 232, 190, 0)');

        ctx.strokeStyle = wGrad;
        ctx.lineWidth = w.thickness;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(w.x - w.len, wy + 3);
        ctx.quadraticCurveTo(w.x - w.len * 0.5, wy - 4, w.x, wy - 1);
        ctx.stroke();
    }

    // 2. Fins grains de sable doré portés doucement par le vent
    for (let i = 0; i < sandParticles.length; i++) {
        const p = sandParticles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt + Math.sin(elapsed * p.waveSpeed + p.phase) * 5 * dt;

        if (p.x > width + 16) {
            p.x = -12 - Math.random() * 40;
            const cY = getDuneCrestY(0, width, crestCenterY);
            p.y = cY - 26 + Math.random() * (height - cY + 26);
        }
        if (p.y > height + 10) {
            p.y = crestCenterY - 12;
        }

        // Ne dessiner que dans la zone de la dune et juste au-dessus de sa crête
        const localCrest = getDuneCrestY(clamp(p.x, 0, width), width, crestCenterY);
        if (p.y < localCrest - 48) continue;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.r * 1.5, p.r * 0.85, -0.1, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

/* -------------------------------------------------------------------------
   LANCEMENT DE L'ANIMATION D'OUVERTURE CAP FERRET
   ------------------------------------------------------------------------- */
export function lancerIntroCapFerret({ onCovered, onComplete } = {}) {
    if (activeCapFerretCleanup) {
        activeCapFerretCleanup();
        activeCapFerretCleanup = null;
    }

    // 1. Construction autonome de l'overlay (aucune modification nécessaire dans index.html)
    const overlay = document.createElement('div');
    overlay.className = 'intro-capferret-overlay';
    overlay.setAttribute('aria-label', "Animation d'ouverture Cap Ferret");
    overlay.innerHTML = `
        <div class="intro-cf-scene" data-role="scene">
            <div class="intro-cf-sky" data-role="sky">
                <div class="intro-cf-sky-glow"></div>
                <div class="intro-cf-clouds" data-role="clouds">${buildSunsetCloudsSvg()}</div>
            </div>

            <canvas class="intro-cf-canvas intro-cf-canvas--sea" data-role="sea-canvas"></canvas>

            <div class="intro-cf-bunker-wrap" data-role="bunker">
                ${buildBunkerSvg()}
            </div>

            <canvas class="intro-cf-canvas intro-cf-canvas--fg" data-role="fg-canvas"></canvas>
        </div>

        <div class="intro-cf-golden-veil" data-role="veil"></div>
    `;

    document.body.appendChild(overlay);

    const sceneEl = overlay.querySelector('[data-role="scene"]');
    const skyEl = overlay.querySelector('[data-role="sky"]');
    const cloudsEl = overlay.querySelector('[data-role="clouds"]');
    const bunkerEl = overlay.querySelector('[data-role="bunker"]');
    const veilEl = overlay.querySelector('[data-role="veil"]');
    const seaCanvas = overlay.querySelector('[data-role="sea-canvas"]');
    const fgCanvas = overlay.querySelector('[data-role="fg-canvas"]');

    const seaCtx = seaCanvas.getContext('2d');
    const fgCtx = fgCanvas.getContext('2d');

    let width = window.innerWidth;
    let height = window.innerHeight;
    let bunkerHeight = 110;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    function resizeCanvases() {
        width = window.innerWidth;
        height = window.innerHeight;
        seaCanvas.width = Math.round(width * dpr);
        seaCanvas.height = Math.round(height * dpr);
        seaCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

        fgCanvas.width = Math.round(width * dpr);
        fgCanvas.height = Math.round(height * dpr);
        fgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

        bunkerHeight = bunkerEl.offsetHeight || 110;
    }
    resizeCanvases();

    // 2. Génération des grains de sable au vent, voiles rasants et nuée d'oiseaux
    const sandColors = ['#FFF1CF', '#F6D39A', '#E6B97E', '#FFE6B8'];
    const sandParticles = Array.from({ length: CAPFERRET_CONFIG.SAND_PARTICLE_COUNT }, () => ({
        x: Math.random() * width,
        y: height * (0.48 + Math.random() * 0.52),
        r: 0.8 + Math.random() * 1.5,
        vx: 42 + Math.random() * 68,
        vy: -3 + Math.random() * 10,
        waveSpeed: 1.4 + Math.random() * 1.6,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.28 + Math.random() * 0.42,
        color: sandColors[Math.floor(Math.random() * sandColors.length)]
    }));

    const sandWisps = Array.from({ length: CAPFERRET_CONFIG.SAND_WISP_COUNT }, (_, idx) => ({
        x: (idx / CAPFERRET_CONFIG.SAND_WISP_COUNT) * (width + 180),
        len: 75 + Math.random() * 115,
        vx: 70 + Math.random() * 55,
        offsetFromCrest: 6 + Math.random() * (height * 0.20),
        thickness: 1.2 + Math.random() * 1.8,
        alpha: 0.14 + Math.random() * 0.16,
        phase: Math.random() * Math.PI * 2
    }));

    // Nuée légère de 11 oiseaux avec écarts naturels en vol
    const flockOffsets = [
        [0.0, 0.0, 1.08],
        [-0.72, -0.35, 0.96],
        [-0.95, 0.28, 0.92],
        [-1.48, -0.14, 1.02],
        [-1.92, -0.58, 0.85],
        [-2.10, 0.42, 0.88],
        [-2.58, 0.04, 0.94],
        [-2.95, -0.44, 0.80],
        [-3.25, 0.30, 0.84],
        [-3.68, -0.12, 0.78],
        [-4.05, 0.20, 0.74]
    ];
    const birds = flockOffsets.slice(0, CAPFERRET_CONFIG.BIRD_COUNT).map(([dx, dy, scale], i) => ({
        dx: dx * 0.95,
        dy: dy * 0.82,
        size: (8.5 + (i % 3) * 1.2) * scale,
        wingSpeed: 4.8 + (i % 4) * 0.55,
        phase: i * 0.85
    }));

    // 3. Cycle de vie & nettoyage garanti du DOM (identique à intro-montagne.js)
    let isFinished = false;
    let hasNotifiedCovered = false;
    let animId = null;

    function notifyCoveredOnce() {
        if (hasNotifiedCovered) return;
        hasNotifiedCovered = true;
        if (typeof onCovered === 'function') {
            onCovered();
        }
    }

    function finishIntro() {
        if (isFinished) return;
        isFinished = true;
        if (animId !== null) {
            cancelAnimationFrame(animId);
            animId = null;
        }
        notifyCoveredOnce();
        window.removeEventListener('resize', resizeCanvases);
        activeCapFerretCleanup = null;

        overlay.remove();
        if (typeof onComplete === 'function') onComplete();
    }

    window.addEventListener('resize', resizeCanvases);

    activeCapFerretCleanup = () => {
        isFinished = true;
        if (animId !== null) cancelAnimationFrame(animId);
        window.removeEventListener('resize', resizeCanvases);
        overlay.remove();
    };

    // Déclenche le fondu d'entrée GPU sur la frame suivante
    requestAnimationFrame(() => {
        if (!isFinished) {
            overlay.classList.add('is-visible');
        }
    });

    const startTime = performance.now();
    let prevTime = startTime;

    function tick(now) {
        if (isFinished) return;

        const elapsed = (now - startTime) * 0.001;
        const dt = clamp((now - prevTime) / 1000, 0.001, 0.05);
        prevTime = now;

        if (elapsed >= CAPFERRET_CONFIG.FADE_IN_END) {
            notifyCoveredOnce();
        }

        if (elapsed >= CAPFERRET_CONFIG.PASS_THROUGH_AT) {
            overlay.classList.add('is-passing-through');
        }

        // --- A. PROGRESSION DE LA MARCHE ET OUVERTURE DE LA VUE SUR LA PLAGE ---
        const revealT = clamp(
            (elapsed - CAPFERRET_CONFIG.CREST_REVEAL_START) /
                (CAPFERRET_CONFIG.CREST_REVEAL_END - CAPFERRET_CONFIG.CREST_REVEAL_START),
            0,
            1
        );
        const revealEase = easeInOutCubic(revealT);

        // Légère bascule du ciel et dérive lente des nuages
        const skyShiftY = revealEase * 22;
        skyEl.style.transform = `translate3d(0, ${skyShiftY.toFixed(2)}px, 0)`;
        cloudsEl.style.transform = `translate3d(${(elapsed * 4.5).toFixed(2)}px, ${(revealEase * 8).toFixed(2)}px, 0)`;

        // Lignes d'horizon, de plage et crête de la dune qui s'abaissent harmonieusement
        // lorsque Clara & Alexis arrivent au bord de la dune
        const horizonY = height * (0.37 + 0.075 * revealEase);
        const beachLineY = height * (0.55 + 0.055 * revealEase);
        const crestCenterY = height * (0.43 + 0.315 * revealEase);

        // Position du soleil (légèrement à droite du centre pour équilibrer avec le bunker à gauche)
        const sunX = width * 0.58;
        const sunRadius = clamp(Math.min(width, height) * 0.068, 26, 48);
        const sunY = horizonY - sunRadius * 0.36;

        // --- B. POSITIONNEMENT DU BUNKER WWII TAGUÉ SUR LA GAUCHE DE LA PLAGE ---
        // Glisse doucement en place sur la plage en contrebas dès que la dune découvre le rivage
        const bunkerTargetTop = beachLineY + (crestCenterY - beachLineY) * 0.56 - bunkerHeight * 0.72;
        const bunkerHiddenShift = (1 - revealEase) * 28;
        bunkerEl.style.transform = `translate3d(0, ${(bunkerTargetTop + bunkerHiddenShift).toFixed(2)}px, 0)`;
        bunkerEl.style.opacity = smoothstep(0.18, 0.58, revealEase).toFixed(3);

        // --- C. DESSIN DU PLAN MER, SOLEIL, OISEAUX ET PLAGE ---
        seaCtx.clearRect(0, 0, width, height);
        drawSunAndOcean(seaCtx, width, height, horizonY, beachLineY, crestCenterY, sunX, sunY, sunRadius, elapsed, revealEase);
        drawBirdFlock(seaCtx, width, sunX, sunY, sunRadius, birds, elapsed);

        // --- D. DESSIN DU PREMIER PLAN : DUNE DORÉE, OYATS, SABLE AU VENT & AVATARS ---
        fgCtx.clearRect(0, 0, width, height);
        drawDuneAndGrass(fgCtx, width, height, crestCenterY, elapsed);
        drawWindBlownSand(fgCtx, width, height, crestCenterY, sandParticles, sandWisps, dt, elapsed);

        // Avatars d'Alexis et Clara : STRICTEMENT même taille, position, vitesse et timing
        // que dans l'animation montagne (intro-montagne.js)
        const avatarFadeIn = smoothstep(CAPFERRET_CONFIG.WALK_START, CAPFERRET_CONFIG.WALK_START + 0.5, elapsed);
        const avatarAlpha = avatarFadeIn;

        if (avatarAlpha > 0.01) {
            const walkT = clamp(
                (elapsed - CAPFERRET_CONFIG.WALK_START) / (CAPFERRET_CONFIG.WALK_END - CAPFERRET_CONFIG.WALK_START),
                0,
                1
            );
            const walkEase = easeOutCubic(walkT);
            const isWalking = elapsed >= CAPFERRET_CONFIG.WALK_START && elapsed < CAPFERRET_CONFIG.WALK_END;

            const startY = height * 0.94;
            const stopY = height * 0.785;
            const coupleY = startY + (stopY - startY) * walkEase;

            const baseUnit = clamp(Math.min(width, height) / 420, 0.85, 1.25);
            const perspScale = baseUnit * (1.28 - 0.34 * walkEase);

            const spacing = 22 * perspScale;
            const centerX = width * 0.5;
            const alexisX = centerX - spacing;
            const claraX = centerX + spacing;

            const walkPhase = elapsed * 7.6;
            const hairSway = isWalking
                ? Math.sin(walkPhase) * 2.4
                : Math.sin(elapsed * 2.1) * 1.4;

            // Douce lueur dorée du soleil couchant qui contourne leurs silhouettes
            const sunsetRimGlow = 0.22 + 0.58 * revealEase;

            fgCtx.save();
            fgCtx.globalAlpha = avatarAlpha;
            drawIntroAlexis(fgCtx, alexisX, coupleY, perspScale, walkPhase + 0.65, isWalking, sunsetRimGlow);
            drawIntroClara(fgCtx, claraX, coupleY + 1.5 * perspScale, perspScale, walkPhase, isWalking, hairSway, sunsetRimGlow);
            fgCtx.restore();
        }

        // --- E. FONDU DORÉ DOUX VERS LE VRAI ACCUEIL DU CALENDRIER ---
        if (elapsed >= CAPFERRET_CONFIG.FADE_OUT_START) {
            const sceneOpacity = 1 - smoothstep(CAPFERRET_CONFIG.FADE_OUT_START, CAPFERRET_CONFIG.FADE_OUT_END, elapsed);
            sceneEl.style.opacity = sceneOpacity.toFixed(3);
        }

        let veilAlpha = 0;
        if (elapsed >= CAPFERRET_CONFIG.FADE_OUT_START - 0.15 && elapsed <= CAPFERRET_CONFIG.TOTAL_DURATION) {
            if (elapsed <= CAPFERRET_CONFIG.VEIL_PEAK) {
                veilAlpha = smoothstep(CAPFERRET_CONFIG.FADE_OUT_START - 0.15, CAPFERRET_CONFIG.VEIL_PEAK, elapsed) * 0.68;
            } else {
                veilAlpha = (1 - smoothstep(CAPFERRET_CONFIG.VEIL_PEAK, CAPFERRET_CONFIG.TOTAL_DURATION, elapsed)) * 0.68;
            }
        }
        const veilScale = 0.88 + smoothstep(CAPFERRET_CONFIG.FADE_OUT_START - 0.15, CAPFERRET_CONFIG.TOTAL_DURATION, elapsed) * 0.32;
        veilEl.style.opacity = veilAlpha.toFixed(3);
        veilEl.style.transform = `scale(${veilScale.toFixed(3)})`;

        if (elapsed >= CAPFERRET_CONFIG.TOTAL_DURATION) {
            finishIntro();
            return;
        }

        animId = requestAnimationFrame(tick);
    }

    animId = requestAnimationFrame(tick);
}

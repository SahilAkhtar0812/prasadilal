(() => {

'use strict';


/* =====================================================
   CONFIGURATION
===================================================== */

const CONFIG = Object.freeze({

    pixelId: '1588712322749073',

    telegramUrl:
        'https://t.me/+Zgdg98bP5O40NWJl',

    /*
     * Qualified PageView
     */
    pageViewDelayMs: 3000,

    passiveReaderDelayMs: 8000,


    /*
     * Telegram Subscribe qualification
     */
    minimumClickTimeMs: 1000,


    /*
     * Redirect
     */
    trackedRedirectDelayMs: 700,

    fastRedirectDelayMs: 50,


    /*
     * Prevent duplicate PageView
     */
    pageViewSessionKey:
        'three_point_qualified_page_view'

});


/* =====================================================
   STATE
===================================================== */

const pageOpenedAt = Date.now();

let pageViewTracked = false;

let subscribeTracked = false;

let navigationStarted = false;

let humanInteractionDetected = false;


/* =====================================================
   LOAD META PIXEL
===================================================== */

function loadMetaPixel() {

    /*
     * Standard Meta Pixel loader
     */

    if (typeof window.fbq !== 'function') {

        window.fbq = function () {

            window.fbq.callMethod
                ? window.fbq.callMethod.apply(
                    window.fbq,
                    arguments
                )
                : window.fbq.queue.push(arguments);

        };

        if (!window._fbq) {
            window._fbq = window.fbq;
        }

        window.fbq.push = window.fbq;

        window.fbq.loaded = true;

        window.fbq.version = '2.0';

        window.fbq.queue = [];

    }


    /*
     * Load Meta script only once
     */

    if (
        !document.querySelector(
            'script[src*="connect.facebook.net/en_US/fbevents.js"]'
        )
    ) {

        const script =
            document.createElement('script');

        script.async = true;

        script.src =
            'https://connect.facebook.net/en_US/fbevents.js';

        const firstScript =
            document.getElementsByTagName('script')[0];

        firstScript.parentNode.insertBefore(
            script,
            firstScript
        );

    }


    /*
     * Initialize Pixel
     */

    if (!window.__tradeWithMunaafPixelInitialized) {

        window.fbq(
            'init',
            CONFIG.pixelId
        );

        window.__tradeWithMunaafPixelInitialized =
            true;

    }

}


/* =====================================================
   SESSION STORAGE
===================================================== */

function sessionPageViewExists() {

    try {

        return sessionStorage.getItem(
            CONFIG.pageViewSessionKey
        ) === 'true';

    } catch (error) {

        return false;

    }

}


function saveSessionPageView() {

    try {

        sessionStorage.setItem(
            CONFIG.pageViewSessionKey,
            'true'
        );

    } catch (error) {

        /*
         * Ignore storage errors
         */

    }

}


/* =====================================================
   AUTOMATION CHECK
===================================================== */

function automationDetected() {

    return navigator.webdriver === true;

}


/* =====================================================
   QUALIFIED PAGEVIEW
===================================================== */

function tryQualifiedPageView() {

    const timeOnPageMs =
        Date.now() - pageOpenedAt;


    /*
     * Visitor interacted and stayed
     * at least 3 seconds.
     */

    const interactionQualified =
        humanInteractionDetected &&
        timeOnPageMs >=
            CONFIG.pageViewDelayMs;


    /*
     * Or visitor stayed focused
     * for 8 seconds.
     */

    const passiveReaderQualified =
        timeOnPageMs >=
            CONFIG.passiveReaderDelayMs;


    const canTrack =

        !pageViewTracked &&

        !sessionPageViewExists() &&

        !automationDetected() &&

        (
            interactionQualified ||
            passiveReaderQualified
        ) &&

        document.visibilityState ===
            'visible' &&

        document.hasFocus() &&

        typeof window.fbq ===
            'function';


    if (!canTrack) {
        return;
    }


    /*
     * Meta PageView
     */

    window.fbq(
        'track',
        'PageView',
        {

            qualified_view: true,

            human_interaction:
                humanInteractionDetected,

            qualification:
                interactionQualified
                    ? 'interaction_3_seconds'
                    : 'focused_8_seconds',

            time_on_page:
                Math.round(
                    timeOnPageMs / 1000
                )

        }
    );


    pageViewTracked = true;

    saveSessionPageView();

}


/* =====================================================
   HUMAN INTERACTION
===================================================== */

function recordHumanInteraction(event) {

    if (
        !event.isTrusted ||
        humanInteractionDetected
    ) {
        return;
    }


    humanInteractionDetected = true;


    /*
     * Try PageView immediately.
     * The function itself checks
     * the 3-second requirement.
     */

    tryQualifiedPageView();

}


function initializeVisitorQualification() {

    const interactionEvents = [

        'pointerdown',
        'touchstart',
        'keydown',
        'scroll',
        'mousemove'

    ];


    interactionEvents.forEach(
        (eventName) => {

            window.addEventListener(
                eventName,
                recordHumanInteraction,
                {
                    passive: true,
                    once: true
                }
            );

        }
    );


    /*
     * Check after 3 seconds
     */

    window.setTimeout(
        tryQualifiedPageView,
        CONFIG.pageViewDelayMs
    );


    /*
     * Check passive visitor
     * after 8 seconds
     */

    window.setTimeout(
        tryQualifiedPageView,
        CONFIG.passiveReaderDelayMs
    );

}


/* =====================================================
   TELEGRAM CLICK
===================================================== */

function handleTelegramClick(event) {

    event.preventDefault();


    /*
     * Prevent duplicate clicks
     */

    if (navigationStarted) {
        return;
    }


    navigationStarted = true;


    const timeOnPageMs =
        Date.now() - pageOpenedAt;


    /*
     * Qualified Telegram click
     */

    const isQualifiedClick =

        event.isTrusted &&

        !automationDetected() &&

        timeOnPageMs >=
            CONFIG.minimumClickTimeMs;


    /* =================================================
       META SUBSCRIBE EVENT
    ================================================= */

    if (

        isQualifiedClick &&

        !subscribeTracked &&

        typeof window.fbq === 'function'

    ) {

        window.fbq(
            'track',
            'Subscribe',
            {

                value: 0,

                currency: 'INR',

                destination: 'Telegram',

                time_on_page:
                    Math.round(
                        timeOnPageMs / 1000
                    )

            }
        );


        subscribeTracked = true;

    }


    /* =================================================
       TELEGRAM REDIRECT
    ================================================= */

    const redirectDelay =

        isQualifiedClick

            ? CONFIG.trackedRedirectDelayMs

            : CONFIG.fastRedirectDelayMs;


    window.setTimeout(
        () => {

            window.location.assign(
                CONFIG.telegramUrl
            );

        },
        redirectDelay
    );

}


/* =====================================================
   INITIALIZE TELEGRAM BUTTONS
===================================================== */

function initializeTelegramButtons() {

    /*
     * IMPORTANT:
     *
     * Your HTML uses:
     *
     * .telegram-join
     *
     * so this selector must include it.
     */

    const buttons =
        document.querySelectorAll(
            '.telegram-join, .join-link, .jnBtn'
        );


    buttons.forEach(
        (button) => {

            /*
             * Force correct Telegram URL
             */

            button.href =
                CONFIG.telegramUrl;


            /*
             * Prevent duplicate listener
             */

            if (
                button.dataset
                    .telegramTrackingAttached
            ) {
                return;
            }


            button.dataset
                .telegramTrackingAttached =
                    'true';


            /*
             * Track click
             */

            button.addEventListener(
                'click',
                handleTelegramClick
            );

        }
    );

}


/* =====================================================
   INITIALIZE
===================================================== */

loadMetaPixel();

initializeVisitorQualification();


/*
 * DOM is already available because
 * script.js is loaded with defer.
 */

if (
    document.readyState ===
    'loading'
) {

    document.addEventListener(
        'DOMContentLoaded',
        initializeTelegramButtons,
        {
            once: true
        }
    );

} else {

    initializeTelegramButtons();

}

})();

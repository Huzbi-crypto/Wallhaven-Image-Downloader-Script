// ==UserScript==
// @name         Wallhaven Image Downloader
// @namespace    wallhaven-image-downloader
// @version      1.0
// @description  Download Wallhaven images with custom ID-Tags-Wallhaven naming convention
// @author       Huzbi
// @match        https://wallhaven.cc/w/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=wallhaven.cc
// @grant        GM_download
// ==/UserScript==

(function() {
    'use strict';

    const LOG_PREFIX = '[Wallhaven Downloader]: ';

    function debugLog(msg, data = '') {
        console.log(`%c${LOG_PREFIX}${msg}`, 'color: #3498db; font-weight: bold;', data);
    }

    function debugError(msg, data = '') {
        console.error(`%c${LOG_PREFIX}ERROR: ${msg}`, 'color: #e74c3c; font-weight: bold;', data);
    }

    // Try multiple possible sidebar/button containers
    const SELECTORS = [
        '#showcase-sidebar', // The main sidebar ID
        'aside.showcase-sidebar', 
        '.sidebar-content',
    ];

    function injectButton() {
        debugLog('Searching for sidebar...');
        
        let sidebar = null;
        for (const selector of SELECTORS) {
            sidebar = document.querySelector(selector);
            if (sidebar) {
                debugLog(`Found sidebar using selector: ${selector}`);
                break;
            }
        }

        if (!sidebar) {
            debugError('Could not find sidebar. Check console for page structure.');
            console.dir(document.body); // Dumps the body so we can inspect IDs
            return;
        }

        // 1. Data Extraction
        const imageId = window.location.pathname.split('/').pop();
        const tagElements = Array.from(document.querySelectorAll('#tags .tagname')).slice(0, 5);
        const tagsSlug = tagElements
            .map(tag => tag.textContent.trim().replace(/[^a-z0-9\s]/gi, '').replace(/\s+/g, '-').toLowerCase())
            .join('-');

        const imgElement = document.querySelector('#wallpaper');
        if (!imgElement) {
            debugError('High-res image (#wallpaper) not found.');
            return;
        }

        const imgSrc = imgElement.src;
        const extension = imgSrc.split('.').pop();
        const fileName = `${imageId}${tagsSlug ? '-' + tagsSlug : ''}-wallhaven.${extension}`;

        // 2. Create Button Element
        const btnContainer = document.createElement('div');
        btnContainer.style.padding = "10px 0";
        
        const dlLink = document.createElement('a');
        dlLink.href = "javascript:void(0);";
        dlLink.className = "btn btn-primary";
        dlLink.style.cssText = "background-color: #6a3c99; width: 100%; display: block; text-align: center; font-weight: bold; padding: 10px; border-radius: 4px; color: #fff; text-decoration: none;";
        dlLink.innerHTML = `<i class="fa fa-download"></i> DOWNLOAD`;

        dlLink.addEventListener('click', (e) => {
            e.preventDefault();
            debugLog('Requesting download: ' + fileName);
            GM_download({
                url: imgSrc,
                name: fileName,
                saveAs: false,
                onload: () => debugLog('Download finished!'),
                onerror: (err) => debugError('Download blocked/failed.', err)
            });
        });

        btnContainer.appendChild(dlLink);

        // 3. Injection Point
        // We try to put it right at the top of the sidebar for visibility
        if (sidebar.firstChild) {
            sidebar.insertBefore(btnContainer, sidebar.firstChild);
        } else {
            sidebar.appendChild(btnContainer);
        }
        
        debugLog('Button injected successfully at top of sidebar.');
    }

    // Run when page is ready
    if (document.readyState === 'complete') {
        injectButton();
    } else {
        window.addEventListener('load', injectButton);
    }
})();
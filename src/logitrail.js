/**
 * Logitrail JavaScript Library - development version
 */    
var Logitrail = {
    /**
     * Initiates the checkout frame
     *
     * @param {object} params
     */
    checkout: function(params) {
        var element = document.getElementById(params.containerId);
        console.debug(element);

        var url = params.bridgeUrl;
        console.debug(url);
        
        if (!params.hasOwnProperty("host")) {
            params.host = 'https://checkout.logitrail.com';
        }
        
        var frame = this.createFrame(element,url,this.getDomain(document.URL));
        
        this.currentCheckout = {
            container: element,
            frame: frame,
            onSuccess: params.success,
            onError: params.error,
            checkoutHost: params.host
        };
    },
    
    /**
     *
     */
    currentCheckout: null,
    
    /**
     *
     */
    loadFrames: function() {
        return;
    },

    /**
     *
     */
    contentLoaded: function(win, fn) {
        var done = false, top = true,

        doc = win.document, root = doc.documentElement,

        add = doc.addEventListener ? 'addEventListener' : 'attachEvent',
        rem = doc.addEventListener ? 'removeEventListener' : 'detachEvent',
        pre = doc.addEventListener ? '' : 'on',

        init = function(e) {
            if (e.type === 'readystatechange' && doc.readyState !== 'complete') return;
            (e.type === 'load' ? win : doc)[rem](pre + e.type, init, false);
            if (!done && (done = true)) fn.call(win, e.type || e);
        },

        poll = function() {
            try { root.doScroll('left'); } catch(e) { setTimeout(poll, 50); return; }
            init('poll');
        };

        if (doc.readyState === 'complete') fn.call(win, 'lazy');
        else {
            if (doc.createEventObject && root.doScroll) {
                try { top = !win.frameElement; } catch(e) { }
                if (top) poll();
            }
            doc[add](pre + 'DOMContentLoaded', init, false);
            doc[add](pre + 'readystatechange', init, false);
            win[add](pre + 'load', init, false);
        }
    },
    getDomain: function(url) {
        var address = {}, input = 'http://';

        address.url = url;

        if (address.url.substring(0, input.length) === input) {
            address.p = 'http://';
        } else {
            address.p = 'https://';
        }

        address.url = address.url.replace(address.p, '');
        address.full = address.p + address.url;
        address.p = address.p.replace('://', '');
        address.url = address.url.split('/');
        address.url = address.url[0];
        return address;
    },
    receiveMessage: function(event) {
        var response = {};

        try {
            response = JSON.parse(event.data);
        } catch (e) {
            // Parsing error
            return;
        }
        if (typeof response.message === "undefined") {
            return;
        }
        
        var current = this.currentCheckout;
        
        // Resize event
        if (response.message === 'logitrail.checkout_resize') {
            if (!current) {
                console.debug('No current checkout active.');
                return;
            }
            
            var frame = current.frame;
            frame.style.height = response.height + 'px';
            console.debug('Resizing...');
            console.debug(frame);
            console.debug(response);
            return;
        }
        
        if (event.origin !== current.checkoutHost) {
            return;
        }
        
        if (response.message === 'logitrail.checkout_result') {
            // Callback to the success script
            this.currentCheckout.onSuccess({
                delivery_fee:      response.delivery_fee,
                delivery_fee_full: response.delivery_fee_full
                order_id:          response.order_id,
                delivery_info:     response.delivery_info
            });
            return;
        }
    },
    createFrame: function(element, url, domain) {
        var ifrm = document.createElement("iframe"),
            dPart = (url.indexOf("?") !== -1 ? '&' : '?') + '_logitrail_frame_p=' + domain.p + '&_logitrail_frame_url=' + domain.url,
            src = url.replace(/&amp;/g, '&') + dPart,
            initHeight;

        ifrm.setAttribute("src", src);
        ifrm.setAttribute("class", "logitrail_frame");
        ifrm.setAttribute("frameborder", "0");
        ifrm.setAttribute("scrolling", "0");
        ifrm.setAttribute("allowtransparency", "true");
        initHeight = element.getAttribute('data-initial-height');
        if (initHeight) {
            ifrm.setAttribute("height", initHeight);
        }
        ifrm.style.width = "100%";
        ifrm.style.overflowY = "hidden";

        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
        element.appendChild(ifrm);
        return ifrm;
    }
};

Logitrail.contentLoaded(window, function() {
    if (window.addEventListener) {
        addEventListener("message", function(e) {
            Logitrail.receiveMessage(e);
        }, false);
    } else {
        attachEvent("onmessage", function(e) {
            Logitrail.receiveMessage(e);
        });
    }

    Logitrail.loadFrames();
});
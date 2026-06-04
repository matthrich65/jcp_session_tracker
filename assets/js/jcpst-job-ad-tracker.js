(function () {
	if ( !window.jcpstTracker || !window.jcpstTracker.ajaxUrl || !window.jcpstTracker.sessionId ) {
		return;
	}

	var startTime             = Date.now();
	var hiddenTime            = 0;
	var hiddenStart           = null;
	var sent                  = false;
	var maxScrollDepth        = 0;
	var scrollPauses          = 0;
	var scrollDirectionChanges = 0;
	var lastScrollY           = window.scrollY;
	var lastDirection         = null;
	var scrollPauseTimer      = null;

	function updateScrollDepth() {
		var scrolled = window.scrollY + window.innerHeight;
		var total    = document.documentElement.scrollHeight;
		if ( total > 0 ) {
			var depth = Math.round( ( scrolled / total ) * 100 );
			if ( depth > maxScrollDepth ) { maxScrollDepth = Math.min( 100, depth ); }
		}
	}

	function onScroll() {
		var currentScrollY = window.scrollY;
		var delta = currentScrollY - lastScrollY;

		if ( Math.abs( delta ) >= 5 ) {
			var direction = delta > 0 ? 'down' : 'up';
			if ( lastDirection !== null && direction !== lastDirection ) {
				scrollDirectionChanges++;
			}
			lastDirection = direction;
			lastScrollY   = currentScrollY;
		}

		clearTimeout( scrollPauseTimer );
		scrollPauseTimer = setTimeout( function () {
			if ( !document.hidden ) { scrollPauses++; }
		}, 1500 );

		updateScrollDepth();
	}

	window.addEventListener( 'scroll', onScroll, { passive: true } );
	updateScrollDepth();

	function getActiveSeconds() {
		var hidden = hiddenTime;
		if ( hiddenStart !== null ) { hidden += Date.now() - hiddenStart; }
		return Math.round( ( Date.now() - startTime - hidden ) / 1000 );
	}

	function sendBeacon() {
		if ( sent ) { return; }
		sent = true;

		var seconds = getActiveSeconds();
		if ( seconds < 1 ) { return; }

		var payload = new URLSearchParams();
		payload.append( 'action',                    'jcpst_record_time_on_page' );
		payload.append( 'session_id',                window.jcpstTracker.sessionId );
		payload.append( 'path',                      window.location.pathname );
		payload.append( 'time_seconds',              String( seconds ) );
		payload.append( 'scroll_depth',              String( maxScrollDepth ) );
		payload.append( 'scroll_pauses',             String( scrollPauses ) );
		payload.append( 'scroll_direction_changes',  String( scrollDirectionChanges ) );

		var data = new Blob( [ payload.toString() ], { type: 'application/x-www-form-urlencoded' } );

		if ( navigator.sendBeacon ) {
			navigator.sendBeacon( window.jcpstTracker.ajaxUrl, data );
		} else {
			fetch( window.jcpstTracker.ajaxUrl, {
				method:      'POST',
				credentials: 'same-origin',
				headers:     { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
				body:        payload.toString(),
				keepalive:   true
			} );
		}
	}

	document.addEventListener( 'visibilitychange', function () {
		if ( document.hidden ) {
			hiddenStart = Date.now();
			clearTimeout( scrollPauseTimer );
		} else {
			if ( hiddenStart !== null ) {
				hiddenTime += Date.now() - hiddenStart;
				hiddenStart = null;
			}
		}
	} );

	window.addEventListener( 'pagehide',     sendBeacon );
	window.addEventListener( 'beforeunload', sendBeacon );
})();

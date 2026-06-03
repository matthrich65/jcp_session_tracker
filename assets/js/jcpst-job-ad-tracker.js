(function () {
	if ( !window.jcpstTracker || !window.jcpstTracker.ajaxUrl || !window.jcpstTracker.sessionId ) {
		return;
	}

	var startTime    = Date.now();
	var hiddenTime   = 0;
	var hiddenStart  = null;
	var sent         = false;

	function getActiveSeconds() {
		var hidden = hiddenTime;
		if ( hiddenStart !== null ) {
			hidden += Date.now() - hiddenStart;
		}
		return Math.round( ( Date.now() - startTime - hidden ) / 1000 );
	}

	function sendBeacon() {
		if ( sent ) { return; }
		sent = true;

		var seconds = getActiveSeconds();
		if ( seconds < 1 ) { return; }

		var payload = new URLSearchParams();
		payload.append( 'action',       'jcpst_record_time_on_page' );
		payload.append( 'session_id',   window.jcpstTracker.sessionId );
		payload.append( 'path',         window.location.pathname );
		payload.append( 'time_seconds', String( seconds ) );

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

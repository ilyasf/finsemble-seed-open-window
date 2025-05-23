// This line imports type declarations for Finsemble's globals such as FSBL and fdc3. You can ignore the warning that it is defined but never used.
// Important! Please use the global FSBL and fdc3 objects. Do not import functionality from finsemble
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { types } from "@finsemble/finsemble-core";

const main = () => {

	console.log("shimming window.open and window.focus");

	// Shim window.open
	(() => {
		// Save a reference to the original window.open
		let originalWindowOpen = window.open;

		// Build a mapping from "target"->"window instance"
		let openedWindowsByTarget = {};

		// The new window.open function
		let newWindowOpen = (url, target, windowFeatures) => {
			// If "target" is specified
			if (!!target) {
				// See if we have an existing window for the target by checking the map
				if (!!openedWindowsByTarget[target]) {
					let alreadyOpened = openedWindowsByTarget[target];

					// If the map has an entry, then check that the window is open
					// NOTE: If the window is still open, then window.opener will have a value
					if (!!alreadyOpened.opener) {
						console.log("ALREADY OPENED, RETURN EXISTING");
						// Return the existing window
						return alreadyOpened;
					} else {
						console.log("ALREADY OPENED BUT CLOSED, CREATE AND RETURN NEW");
						// The previously opened window was closed
						//
						// Remove the window from the map
						delete openedWindowsByTarget[target];

						// Create a new window and add the window to the map
						const newWindow = originalWindowOpen(url, target, windowFeatures);
						openedWindowsByTarget[target] = newWindow;

						// Return the created window
						return newWindow;
					}
				} else {
					// There is no window associated with this target
					//
					// Create a new window
					console.log("NOT ALREADY OPENED, CREATE AND RETURN");
					const newWindow = originalWindowOpen(url, target, windowFeatures);
					// Add the window to the map
					openedWindowsByTarget[target] = newWindow;
					// Return the window
					return newWindow;
				}
			} else {
				console.log("NO TARGET, USE ORIGINAL FUNCTION");
				// There is no target, return the window as normal
				return originalWindowOpen(url, target, windowFeatures);
			}
		}

		// Assign the new function
		window.open = newWindowOpen;
		console.log("window.open has been shimmed");
	})();


	// Shim window.focus
	(() => {
		// Save a reference to the original window.focus (or a no-op if window.focus does not exist)
		// NOTE: window.focus SHOULD exist in all cases, the no-op exists as a fallback
		let originalWindowFocus = window.focus || (() => {});

		// The new window.focus implementation
		let newWindowFocus = () => {
			// Invoke the original function
			originalWindowFocus();
			// Also invoke finsembleWindow.focus (if present)
			window.finsembleWindow?.focus();
		}

		// Assign the new function
		window.focus = newWindowFocus;
		console.log("window.focus has been shimmed");
	})();

};

/**
 * This initialization pattern is required in preloads. Do not call FSBL or fdc3 without waiting for this pattern.
 */
if (window.FSBL && FSBL.addEventListener) {
	FSBL.addEventListener("onReady", main);
} else {
	window.addEventListener("FSBLReady", main);
}

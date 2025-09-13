// Session cleanup utility
// This can be run as a cron job or scheduled task

import authController from "../api/auth/controllers/auth";

/**
 * Cleanup expired sessions
 * Call this function periodically (e.g., every hour) to clean up expired sessions
 */
export function cleanupExpiredSessions(): void {
    try {
        // Call the cleanup method from the auth controller
        authController.cleanupSessions();
        console.log("Session cleanup completed successfully");
    } catch (error) {
        console.error("Error during session cleanup:", error);
    }
}

// If running this file directly, perform cleanup
if (require.main === module) {
    cleanupExpiredSessions();
}

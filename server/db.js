// Import dependencies
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ["../.env", "/etc/secrets/.env"] });

// Define important constants
const dbURL = process.env.PUBLIC_DB_URL;
const dbKey = process.env.SECRET_DB_KEY;
const db = createClient(dbURL, dbKey, {db: {schema: "api"}});

/**
 * @typedef {Object} dbSuccess A message to indicate success for a database operation.
 * @property {String} success A short success message.
*/
/**
 * @typedef {Object} dbError An error message returned from database operations.
 * @property {String} error A description of the error.
*/

/**
 * @typedef {Object} recordData An object containing information about a user's high score.
 * @property {Number?} time The fastest time the user has gotten on a standard game, if known; null otherwise.
 * @property {Number | String?} seed The seed of the game, if known; "unknown" otherwise.
 * @property {String?} set_on The date the record was set, if known; "unknown" otherwise.
 */
/**
 * Retrives a user's previous high score (if it exists).
 * @param {Number} userID The ID of the user who's data to retrieve.
 * @returns {recordData | dbError | void} The returned database object if a valid record was found, an error message if an error occurred, or void otherwise.
 */
async function selectHS(userID) {
	const { data, error } = await db.from("Records").select("time, seed, set_on").eq("id", userID);
	if (error) {
		console.log(error);
		return {error: "Unable to retrieve user data."};
	}
	if (!data) {
		console.log("No record found.");
		return {time: 0, seed: null, set_on: null};
	}
	if (!data.length) {
		console.log("No record found.");
		return {time: 0, seed: null, set_on: null};
	}
	if (!data[0].time) {
		console.log("Record found with no recorded time.");
		return {time: 0, seed: null, set_on: null};
	}
	if (!data[0].seed) data.seed = "unknown";
	if (!data[0].set_on) data.set_on = "unknown";
	return data[0];
}

/**
 * Updates a user's high score.
 * @param {Number} userID The ID of the user who's record should be set.
 * @param {Number} time The new record time.
 * @param {Number} seed The seed of the board where the record was set.
 * @param {String} date The timestamp of when the record was set.
 * @returns {dbError | dbSuccess} A success or error message depending on the database response.
 */
async function upsertHS(userID, time, seed, date) {
	const {error} = await db.from("Records").upsert({id: userID, time, seed, set_on: date}, {onConflict: "id", ignoreDuplicates: false});
	if (error) {
		console.log(error);
		return {error: "Unable to retrieve user data."};
	}
	return {success: "Data updated successfully."};
}

/**
 * Updates the user's high score if a new record was set.
 * @param {Number} userID The ID of the user to check.
 * @param {Number} time The new time to compare against the best score.
 * @param {Number} seed The seed of the game with the potential new high score.
 * @param {String} date The timestamp of the new record.
 * @returns {dbError | dbSuccess | recordData} The old record (if a new record was not set) or an error or success message as required.
 */
export async function updateIfRecord(userID, time, seed, date) {
	const sRes = await selectHS(userID);
	if (sRes.error) {
		return {error: sRes.error};
	}
	console.log(JSON.stringify(sRes), sRes.time, time, sRes.time>time);
	if (sRes.time >= time || !sRes.time) {
		return upsertHS(userID, time, seed, date);
	}
	return sRes;
}

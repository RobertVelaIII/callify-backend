"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCallStatus = exports.initiateCall = void 0;
const axios_1 = __importDefault(require("axios"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
// Bland.ai API configuration
// In production, use environment variables for the API key
const BLAND_API_KEY = process.env.BLAND_API_KEY || 'your-bland-api-key-here'; // Replace with your actual API key
const BLAND_API_URL = 'https://api.bland.ai/v1';
/**
 * Initiates a call using the Bland.ai API
 * @param name The recipient's name
 * @param phoneNumber The recipient's phone number
 * @param websiteUrl The website URL that was analyzed
 * @returns Call details including ID and status
 */
async function initiateCall(name, phoneNumber, websiteUrl) {
    var _a, _b, _c;
    try {
        // Get the website analysis from Firestore
        const analysisSnapshot = await db.collection('websiteAnalyses')
            .where('websiteUrl', '==', websiteUrl)
            .orderBy('timestamp', 'desc')
            .limit(1)
            .get();
        let callScript = '';
        let businessName = '';
        if (!analysisSnapshot.empty) {
            const analysisData = analysisSnapshot.docs[0].data();
            callScript = ((_a = analysisData.analysis) === null || _a === void 0 ? void 0 : _a.callScript) || '';
            businessName = ((_b = analysisData.analysis) === null || _b === void 0 ? void 0 : _b.businessName) || '';
        }
        else {
            // Fallback if no analysis is found
            callScript = `Hello, this is a test call from Callify. We're testing our AI-powered phone automation platform. Is this ${name}?`;
            businessName = 'Unknown Business';
        }
        // Format the phone number (remove non-digits except leading +)
        const formattedPhone = phoneNumber.startsWith('+')
            ? '+' + phoneNumber.substring(1).replace(/\D/g, '')
            : phoneNumber.replace(/\D/g, '');
        // Make the API call to Bland.ai
        const response = await axios_1.default.post(`${BLAND_API_URL}/calls`, {
            phone_number: formattedPhone,
            task: callScript,
            voice: 'male',
            reduce_latency: true,
            wait_for_greeting: true,
            metadata: {
                name,
                websiteUrl,
                businessName
            }
        }, {
            headers: {
                'Authorization': `Bearer ${BLAND_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        // Return the call details
        return {
            callId: response.data.call_id,
            status: response.data.status,
            details: response.data
        };
    }
    catch (error) {
        console.error('Bland.ai API error:', ((_c = error.response) === null || _c === void 0 ? void 0 : _c.data) || error.message);
        throw new Error('Failed to initiate call with Bland.ai');
    }
}
exports.initiateCall = initiateCall;
/**
 * Gets the status of a call from Bland.ai
 * @param callId The ID of the call
 * @returns Call status details
 */
async function getCallStatus(callId) {
    var _a;
    try {
        const response = await axios_1.default.get(`${BLAND_API_URL}/calls/${callId}`, {
            headers: {
                'Authorization': `Bearer ${BLAND_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        return {
            callId,
            status: response.data.status,
            details: response.data
        };
    }
    catch (error) {
        console.error('Bland.ai status check error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        throw new Error('Failed to get call status from Bland.ai');
    }
}
exports.getCallStatus = getCallStatus;
//# sourceMappingURL=blandService.js.map
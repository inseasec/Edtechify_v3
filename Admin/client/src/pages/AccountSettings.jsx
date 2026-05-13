import api from '@/lib/api'
import { showErrorToast, showSuccessToast } from '@/utils/toastUtils'
import { Info, Eye, EyeOff } from 'lucide-react'
import React, { useState, useEffect } from 'react'

const PaymentAccount = () => {
    const [apiKey, setApiKey] = useState("");
    const [apiSecret, setApiSecret] = useState("");
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null); // { ok: bool, message: string }
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState("");

    const [showSecret, setShowSecret] = useState(false);



    // // Fetch from API on component mount
    useEffect(() => {
        fetchApiData();
    }, []);

    // Wipe any prior test verdict when the user edits the credentials so the
    // banner can't show a stale "valid" tick next to changed values.
    useEffect(() => {
        if (testResult !== null) setTestResult(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiKey, apiSecret]);

    const fetchApiData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/paymentConfig/getConfigDetails');
            // console.log("API Response:", response.data);
            setApiSecret(response.data.razorpaySecret)
            setApiKey(response.data.razorpayKey)

        } catch (error) {
            console.error('Error Fetching from API:', error);
            const status = error?.response?.status;
            if (status === 404) setMsg("Alert: No Payment Configuration found!");
            else if (status === 403) setMsg("Access denied. Only Super Admin can update payment configuration.");
            else if (status === 401) setMsg("Please sign in again to update payment configuration.");
            else setMsg("Could not load payment configuration.");
        } finally {
            setLoading(false);
        }
    };
    const saveToAPI = async () => {
        setSaving(true);
        try {
            await api.post('/paymentConfig/saveOrUpdate', {
                "razorpayKey": apiKey,
                "razorpaySecret": apiSecret,
                "isActive": true
            });
            showSuccessToast("Api credentials Saved Successfully");
            setMsg(" ")
        } catch (error) {
            const status = error?.response?.status;
            const data = error?.response?.data;
            const backendMsg =
              (data && typeof data === "object" && data.message) ? String(data.message)
              : (typeof data === "string" ? data : null);

            if (status === 403) showErrorToast(backendMsg || "Access denied. Only Super Admin can update payment configuration.");
            else if (status === 401) showErrorToast("Please sign in again to update payment configuration.");
            else showErrorToast(backendMsg || 'Error in saving API credentials');
        } finally {
            setSaving(false);
        }
    };

    // Calls Admin → /paymentConfig/test, which calls Razorpay's read-only
    // probe with these creds. Lets the admin verify validity *before* Save.
    const testConnection = async () => {
        setTesting(true);
        setTestResult(null);
        try {
            const response = await api.post('/paymentConfig/test', {
                "razorpayKey": apiKey,
                "razorpaySecret": apiSecret,
            });
            const data = response?.data || {};
            const ok = !!data.success;
            const message = data.message || (ok ? "Razorpay accepted these credentials." : "Razorpay rejected these credentials.");
            setTestResult({ ok, message });
            if (ok) showSuccessToast(message);
            else showErrorToast(message);
        } catch (error) {
            const status = error?.response?.status;
            const data = error?.response?.data;
            const backendMsg =
              (data && typeof data === "object" && data.message) ? String(data.message)
              : (typeof data === "string" ? data : null);

            let message;
            if (status === 403) message = backendMsg || "Access denied. Only Super Admin can test payment configuration.";
            else if (status === 401) message = "Please sign in again to test payment configuration.";
            else message = backendMsg || "Could not test Razorpay connection.";

            setTestResult({ ok: false, message });
            showErrorToast(message);
        } finally {
            setTesting(false);
        }
    };

    return (
        <div className='h-[100vh]' style={{ margin: 'auto', padding: '20px' }}>
            <h1 className='text-center text-grey-800 bg-[whitesmoke] font-black shadow-md shadow-white text-xl p-4'>Payment Gateway Settings</h1>
            <h2 className='text-orange-500 text-left font-bold flex p-[15px_2px]'>
                <Info className="shrink-0" size={22} /> <span className='text-white ml-[20px] font-bold bg-orange-500 p-[3px_7px] rounded-md'>
                    Note: Enter your Razorpay API Key and API Secret Key to connect your Razorpay account with the application and enable online payments.</span></h2>
            <div className='w-[100%]'>
                <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                        <div className="p-6 sm:p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* API Key Input */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700">
                                        API Key
                                        <span className="text-xs text-gray-500 ml-2">(Razorpay Key ID)</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={apiKey}
                                            onChange={(e) => setApiKey(e.target.value)}
                                            placeholder="rzp_live_xxxxxxxxxxxx"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors bg-gray-50 hover:bg-white text-gray-700"
                                        />
                                        {apiKey && (
                                            <span className="absolute right-3 top-3 text-green-500">
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* API Secret Input */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700">
                                        API Secret
                                        <span className="text-xs text-gray-500 ml-2">(Razorpay Key ID)</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showSecret ? "text" : "password"}
                                            value={apiSecret}
                                            onChange={(e) => setApiSecret(e.target.value)}
                                            placeholder="••••••••••••••••"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors bg-gray-50 hover:bg-white text-gray-700"
                                        />
                                        {apiSecret && (
                                            <button
                                                type="button"
                                                onClick={() => setShowSecret(!showSecret)}
                                                className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                                            >
                                                {apiSecret ? (
                                                    showSecret ? (
                                                        <EyeOff className="h-5 w-5" />
                                                    ) : (
                                                        <Eye className="h-5 w-5" />
                                                    )
                                                ) : null}
                                            </button>

                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Test result banner — gives the admin instant feedback
                                that Razorpay accepts or rejects these creds, without
                                anyone having to attempt a real checkout. */}
                            {testResult && (
                                <div className={`mt-6 p-3 rounded-md text-sm font-medium border ${
                                    testResult.ok
                                        ? 'bg-green-50 text-green-800 border-green-200'
                                        : 'bg-red-50 text-red-800 border-red-200'
                                }`}>
                                    {testResult.ok ? '✓ ' : '✗ '}{testResult.message}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="mt-8 flex flex-col sm:flex-row justify-between gap-3 border-t pt-6">
                                <div className='pt-[5px]'>
                                    <h1 className='bg-red-500 text-white text-[14px] font-medium p-[0px_5px] rounded-md ' >{msg}</h1>
                                </div>
                                {/* <button
                                    onClick={() => {
                                        setApiKey('');
                                        setApiSecret('');
                                    }}
                                    className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                                >
                                    Clear
                                </button> */}

                                <div className="flex flex-col sm:flex-row gap-3 sm:ml-auto">
                                    <button
                                        onClick={testConnection}
                                        disabled={!apiKey || !apiSecret || testing || saving}
                                        title="Verify these credentials against Razorpay without saving"
                                        className={`
                                             w-full sm:w-auto px-6 py-3 text-sm font-bold rounded-lg
                                                  transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                                                    ${(!apiKey || !apiSecret || saving)
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                                : 'bg-white text-blue-600 border border-blue-500 hover:bg-blue-50 shadow-sm'
                                            }
                                                  ${testing ? 'opacity-75 cursor-wait' : ''}
                                                   `}
                                    >
                                        {testing ? (
                                            <span className="flex items-center justify-center">
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Testing...
                                            </span>
                                        ) : (
                                            'Test Connection'
                                        )}
                                    </button>

                                    <button
                                        onClick={saveToAPI}
                                        disabled={!apiKey || !apiSecret || saving || testing}
                                        className={`
                                             w-full sm:w-auto px-8 py-3 text-sm font-bold text-white rounded-lg
                                                  transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
                                                    ${(!apiKey || !apiSecret || testing)
                                                ? 'bg-gray-300 cursor-not-allowed hover:scale-100'
                                                : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl'
                                            }
                                                  ${saving ? 'opacity-75 cursor-wait' : ''}
                                                   `}
                                    >
                                        {saving ? (
                                            <span className="flex items-center justify-center">
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Saving...
                                            </span>
                                        ) : (
                                            'Save Configuration'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
export default PaymentAccount;

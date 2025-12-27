'use client';

import { useState, useEffect } from 'react';

interface SystemStatus {
    database: 'connected' | 'error' | 'checking';
    tables: { [key: string]: boolean };
    apis: { [key: string]: 'ok' | 'error' | 'checking' };
    environment: { [key: string]: boolean };
}

export default function SystemStatusPage() {
    const [status, setStatus] = useState<SystemStatus>({
        database: 'checking',
        tables: {},
        apis: {},
        environment: {}
    });

    useEffect(() => {
        checkSystemStatus();
    }, []);

    const checkSystemStatus = async () => {
        // Check API endpoints
        const apiEndpoints = [
            '/api/batches',
            '/api/stones',
            '/api/sales-history',
            '/api/market-trends'
        ];

        const apiStatus: { [key: string]: 'ok' | 'error' | 'checking' } = {};

        for (const endpoint of apiEndpoints) {
            try {
                const response = await fetch(endpoint);
                apiStatus[endpoint] = response.ok ? 'ok' : 'error';
            } catch (error) {
                apiStatus[endpoint] = 'error';
            }
        }

        setStatus(prev => ({
            ...prev,
            apis: apiStatus,
            database: Object.values(apiStatus).some(s => s === 'ok') ? 'connected' : 'error'
        }));
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'ok':
            case 'connected':
            case true:
                return '✅';
            case 'error':
            case false:
                return '❌';
            default:
                return '🔄';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ok':
            case 'connected':
            case true:
                return 'text-green-600';
            case 'error':
            case false:
                return 'text-red-600';
            default:
                return 'text-yellow-600';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        System Status
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Mineral AI Pricing System Health Check
                    </p>
                </div>

                {/* Database Status */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        Database Connection
                    </h2>
                    <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getStatusIcon(status.database)}</span>
                        <span className={`font-medium ${getStatusColor(status.database)}`}>
                            {status.database === 'connected' ? 'Connected' :
                                status.database === 'error' ? 'Connection Error' : 'Checking...'}
                        </span>
                    </div>
                </div>

                {/* API Endpoints */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        API Endpoints
                    </h2>
                    <div className="space-y-3">
                        {Object.entries(status.apis).map(([endpoint, apiStatus]) => (
                            <div key={endpoint} className="flex items-center justify-between">
                                <span className="text-gray-700 dark:text-gray-300">{endpoint}</span>
                                <div className="flex items-center space-x-2">
                                    <span className="text-xl">{getStatusIcon(apiStatus)}</span>
                                    <span className={`text-sm font-medium ${getStatusColor(apiStatus)}`}>
                                        {apiStatus === 'ok' ? 'OK' :
                                            apiStatus === 'error' ? 'Error' : 'Checking...'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* System Features */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        System Features
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <h3 className="font-medium text-gray-900 dark:text-white">Core Features</h3>
                            <div className="space-y-1 text-sm">
                                <div className="flex items-center space-x-2">
                                    <span>✅</span>
                                    <span>Individual stone tracking</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span>✅</span>
                                    <span>AI price suggestions</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span>✅</span>
                                    <span>User price adjustments</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span>✅</span>
                                    <span>AI learning system</span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-medium text-gray-900 dark:text-white">Advanced Features</h3>
                            <div className="space-y-1 text-sm">
                                <div className="flex items-center space-x-2">
                                    <span>✅</span>
                                    <span>Market trend integration</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span>✅</span>
                                    <span>6% annual inflation adjustment</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span>✅</span>
                                    <span>Price history tracking</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span>✅</span>
                                    <span>Vietnamese currency (VND)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        Quick Actions
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <a
                            href="/batches/new"
                            className="block p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                        >
                            <div className="text-2xl mb-2">📦</div>
                            <div className="font-medium text-gray-900 dark:text-white">Add New Batch</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Start with mineral entry</div>
                        </a>

                        <a
                            href="/stones"
                            className="block p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                        >
                            <div className="text-2xl mb-2">💎</div>
                            <div className="font-medium text-gray-900 dark:text-white">Manage Stones</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Individual stone pricing</div>
                        </a>

                        <a
                            href="/market-trends"
                            className="block p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                        >
                            <div className="text-2xl mb-2">📈</div>
                            <div className="font-medium text-gray-900 dark:text-white">Market Trends</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Set market conditions</div>
                        </a>
                    </div>
                </div>

                {/* Refresh Button */}
                <div className="mt-6 text-center">
                    <button
                        onClick={checkSystemStatus}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        🔄 Refresh Status
                    </button>
                </div>
            </div>
        </div>
    );
}
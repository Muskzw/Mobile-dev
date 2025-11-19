import Layout from '../components/Layout';
import { Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your preferences and customization</p>
        </div>

        <div className="glass-card rounded-2xl p-8">
          <div className="flex items-center space-x-3 mb-8">
            <div className="p-2 bg-primary/10 rounded-lg">
              <SettingsIcon className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">General Settings</h2>
          </div>

          <div className="space-y-8">
            <div>
              <label className="block text-sm font-medium mb-3">
                AI Features
              </label>
              <div className="flex items-center space-x-3 p-4 rounded-xl glass-input">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-primary text-primary focus:ring-primary" />
                <div>
                  <span className="text-sm font-medium block">Enable AI-powered features</span>
                  <span className="text-xs text-muted-foreground">Enable AI document writing, price estimation, and smart insights</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">
                Email Notifications
              </label>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 rounded-xl glass-input">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-primary text-primary focus:ring-primary" />
                  <span className="text-sm">Quotation acceptance</span>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-xl glass-input">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-primary text-primary focus:ring-primary" />
                  <span className="text-sm">Payment reminders</span>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-xl glass-input">
                  <input type="checkbox" className="w-4 h-4 rounded border-primary text-primary focus:ring-primary" />
                  <span className="text-sm">AI insights</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Default Currency
                </label>
                <select className="w-full px-4 py-2.5 rounded-xl glass-input outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="ZAR">ZAR (R)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Default Tax Rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  defaultValue="0"
                  className="w-full px-4 py-2.5 rounded-xl glass-input outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-border">
            <button className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl hover:bg-primary/90 transition shadow-lg shadow-primary/25 font-medium">
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}


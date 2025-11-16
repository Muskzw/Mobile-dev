import { useQuery } from '@tanstack/react-query';
import Layout from '../components/Layout';
import api from '../api/client';
import { TrendingUp, FileText, DollarSign, Clock, Sparkles, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats');
      return response.data;
    }
  });

  const { data: insights } = useQuery({
    queryKey: ['ai-insights'],
    queryFn: async () => {
      const response = await api.get('/ai/insights');
      return response.data;
    }
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your business overview.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Quotations"
            value={stats?.quotations?.total || 0}
            icon={FileText}
            color="blue"
            subtitle={`${stats?.quotations?.accepted || 0} accepted`}
          />
          <StatCard
            title="Total Invoices"
            value={stats?.invoices?.total || 0}
            icon={DollarSign}
            color="green"
            subtitle={`${stats?.invoices?.paid || 0} paid`}
          />
          <StatCard
            title="Upcoming Deadlines"
            value={stats?.upcomingDeadlines || 0}
            icon={Clock}
            color="orange"
            subtitle="Next 7 days"
          />
          <StatCard
            title="Win Rate"
            value={`${insights?.winPercentage || 0}%`}
            icon={TrendingUp}
            color="purple"
            subtitle="Quotation acceptance"
          />
        </div>

        {/* AI Insights */}
        {insights?.aiRecommendations && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
            <div className="flex items-center space-x-2 mb-4">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-900">AI Recommendations</h2>
            </div>
            <p className="text-gray-700 whitespace-pre-line">{insights.aiRecommendations}</p>
          </div>
        )}

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {stats?.recentActivity?.length > 0 ? (
              stats.recentActivity.map((doc: any) => (
                <Link
                  key={doc.id}
                  to={`/documents/${doc.id}`}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  <div>
                    <p className="font-medium text-gray-900">{doc.document_number}</p>
                    <p className="text-sm text-gray-600">
                      {doc.client_name || 'No client'} • {doc.type}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {doc.currency} {parseFloat(doc.total).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">{doc.status}</p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No recent activity</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/documents/create?type=quotation"
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-center"
            >
              <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="font-medium text-gray-900">Create Quotation</p>
            </Link>
            <Link
              to="/documents/create?type=invoice"
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition text-center"
            >
              <DollarSign className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="font-medium text-gray-900">Create Invoice</p>
            </Link>
            <Link
              to="/clients"
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition text-center"
            >
              <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="font-medium text-gray-900">Add Client</p>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ title, value, icon: Icon, color, subtitle }: any) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}


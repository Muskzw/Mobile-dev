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
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's your business overview.</p>
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
          <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg p-6 border border-primary/20">
            <div className="flex items-center space-x-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">AI Recommendations</h2>
            </div>
            <p className="text-foreground whitespace-pre-line">{insights.aiRecommendations}</p>
          </div>
        )}

        {/* Recent Activity */}
        <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {stats?.recentActivity?.length > 0 ? (
              stats.recentActivity.map((doc: any) => (
                <Link
                  key={doc.id}
                  to={`/documents/${doc.id}`}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition"
                >
                  <div>
                    <p className="font-medium">{doc.document_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {doc.client_name || 'No client'} • {doc.type}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {doc.currency} {parseFloat(doc.total).toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">{doc.status}</p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-8">No recent activity</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/documents/create?type=quotation"
              className="p-4 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-primary/5 transition text-center"
            >
              <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="font-medium">Create Quotation</p>
            </Link>
            <Link
              to="/documents/create?type=invoice"
              className="p-4 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-primary/5 transition text-center"
            >
              <DollarSign className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="font-medium">Create Invoice</p>
            </Link>
            <Link
              to="/clients"
              className="p-4 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-primary/5 transition text-center"
            >
              <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="font-medium">Add Client</p>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ title, value, icon: Icon, color, subtitle }: any) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
  };

  return (
    <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-2">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}


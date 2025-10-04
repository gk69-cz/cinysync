import Dashboard from '../../pages/dashboard';
import { ThemeProvider } from '../ThemeProvider';

export default function DashboardExample() {
  return (
    <ThemeProvider>
      <Dashboard />
    </ThemeProvider>
  );
}

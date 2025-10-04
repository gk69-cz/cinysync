import { ThemeProvider } from '../ThemeProvider';

export default function ThemeProviderExample() {
  return (
    <ThemeProvider defaultTheme="dark">
      <div className="p-8 bg-background text-foreground">
        <p>Theme Provider is active (dark mode by default)</p>
      </div>
    </ThemeProvider>
  );
}

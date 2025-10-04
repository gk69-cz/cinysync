import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <Card className="p-8 hover-elevate transition-all duration-300">
      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="font-display font-semibold text-2xl mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </Card>
  );
}

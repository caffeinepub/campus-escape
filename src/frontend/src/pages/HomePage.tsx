import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Award, MapPin, Truck } from "lucide-react";
import { motion } from "motion/react";
import ProductCard from "../components/ProductCard";
import { useProducts } from "../hooks/useQueries";

type Page = "home" | "products" | "admin";

interface HomePageProps {
  onNavigate: (page: Page) => void;
}

const features = [
  {
    icon: MapPin,
    title: "Local Sourcing",
    desc: "Partnered with 12 family farms within 50 miles of your door.",
  },
  {
    icon: Truck,
    title: "Daily Delivery",
    desc: "Fresh dairy delivered every morning before 8am, 7 days a week.",
  },
  {
    icon: Award,
    title: "Premium Quality",
    desc: "Grass-fed, hormone-free, and certified organic across our full range.",
  },
];

export default function HomePage({ onNavigate }: HomePageProps) {
  const { data: products, isLoading } = useProducts();
  const featured = (products ?? []).slice(0, 4);

  return (
    <main>
      {/* Hero */}
      <section
        className="relative min-h-[480px] flex items-center overflow-hidden bg-muted"
        data-ocid="hero.section"
      >
        <img
          src="/assets/generated/farm-hero.dim_1200x500.jpg"
          alt="Fresh farm dairy"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="max-w-xl"
          >
            <p className="text-white/80 text-sm font-medium mb-3 tracking-wide uppercase">
              Farm Fresh Since 2018
            </p>
            <h1 className="text-4xl md:text-5xl xl:text-6xl font-extrabold text-white leading-tight mb-4 font-display">
              Fresh Dairy,
              <br />
              Delivered Daily
            </h1>
            <p className="text-white/85 text-lg mb-8 leading-relaxed">
              The finest grass-fed dairy from local farms, delivered to your
              door every morning.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:opacity-90 rounded-lg px-7"
                onClick={() => onNavigate("products")}
                data-ocid="hero.shop_now.button"
              >
                Shop Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent text-white border-white/60 hover:bg-white/10 rounded-lg px-7"
                data-ocid="hero.how_it_works.button"
              >
                How it Works
              </Button>
            </div>
          </motion.div>
        </div>
        {/* Carousel dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-primary" />
          <span className="w-2 h-2 rounded-full bg-white/50 mt-0.5" />
          <span className="w-2 h-2 rounded-full bg-white/50 mt-0.5" />
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-accent" data-ocid="benefits.section">
        <div className="max-w-6xl mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl md:text-3xl font-bold text-center mb-10 font-display"
          >
            Why Choose Farm to Home?
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center text-center gap-3"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <f.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-semibold text-base">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Products grid */}
      <section className="py-16" data-ocid="featured_products.section">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl md:text-3xl font-bold font-display"
            >
              Our Products
            </motion.h2>
            <p className="text-muted-foreground mt-2">
              Hand-selected dairy from our trusted farm partners
            </p>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="space-y-3"
                  data-ocid="featured_products.loading_state"
                >
                  <Skeleton className="h-44 rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {featured.map((p, i) => (
                <ProductCard key={p.id.toString()} product={p} index={i + 1} />
              ))}
            </div>
          )}
          <div className="text-center mt-10">
            <Button
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-lg px-8"
              onClick={() => onNavigate("products")}
              data-ocid="featured_products.view_all.button"
            >
              View All Products <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </section>

      {/* Admin promo */}
      <section className="py-14 bg-accent" data-ocid="admin_promo.section">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-md">
              <h2 className="text-2xl md:text-3xl font-bold mb-3 font-display">
                Admin Dashboard
              </h2>
              <p className="text-muted-foreground mb-6">
                Manage your products, track orders, and update delivery statuses
                — all from one clean interface.
              </p>
              <Button
                className="bg-primary text-primary-foreground hover:opacity-90 rounded-lg px-7"
                onClick={() => onNavigate("admin")}
                data-ocid="admin_promo.access.button"
              >
                Access Admin Panel
              </Button>
            </div>
            <div className="bg-white rounded-xl border border-border shadow-card p-5 w-full max-w-sm">
              <div className="space-y-3">
                {[
                  "🥛 Whole Milk — $2.99",
                  "🧈 Organic Butter — $4.49",
                  "🫙 Greek Yogurt — $3.29",
                  "🧀 Cheddar Block — $5.99",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0"
                  >
                    <span>{item}</span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      In Stock
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

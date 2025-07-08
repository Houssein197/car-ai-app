import { useRouter } from "next/router";
import { useState } from "react";
import {
  Box, Button, Typography, Paper, Stack
} from "@mui/material";

const plans = [
  {
    key: "one-time",
    name: "One-time",
    desc: "Perfect for trying out — pay once and get 50 credits.",
    price: "$49",
    highlight: false,
  },
  {
    key: "basic",
    name: "Basic",
    desc: "Monthly plan with 100 credits, perfect for small dealerships.",
    price: "$99/mo",
    highlight: true,
  },
  {
    key: "pro",
    name: "Pro",
    desc: "For high-volume sellers — 300 credits each month.",
    price: "$199/mo",
    highlight: false,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [selected, setSelected] = useState(null);

  const handleSelectPlan = (plan) => {
    setSelected(plan);
    router.push(`/signup?plan=${plan}`);
  };

  return (
    <Box sx={{ bgcolor: "#f7fafd", minHeight: "100vh", py: 10 }}>
      <Typography variant="h3" fontWeight={800} textAlign="center" mb={8} color="#2563eb">
        Choose your plan
      </Typography>
      <Stack direction={{ xs: "column", md: "row" }} spacing={4} justifyContent="center" alignItems="stretch" px={2}>
        {plans.map((plan) => (
          <Paper
            key={plan.key}
            elevation={plan.highlight ? 4 : 1}
            sx={{
              flex: "1 1 250px",
              maxWidth: 340,
              mx: "auto",
              p: 5,
              borderRadius: 4,
              bgcolor: "#fff",
              border: plan.highlight ? "2px solid #2563eb" : "1px solid #e5eaf2",
              boxShadow: plan.highlight ? "0 4px 24px 0 #2563eb11" : "0 2px 12px 0 #2563eb08",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography variant="h5" fontWeight={700} color={plan.highlight ? "#2563eb" : "#222"} mb={2}>
              {plan.name}
            </Typography>
            <Typography color="text.secondary" mb={3} textAlign="center">
              {plan.desc}
            </Typography>
            <Typography variant="h4" fontWeight={800} mb={3} color="#2563eb">
              {plan.price}
            </Typography>
            <Button
              onClick={() => handleSelectPlan(plan.key)}
              variant={plan.highlight ? "contained" : "outlined"}
              color="primary"
              size="large"
              sx={{
                fontWeight: 700,
                borderRadius: 2,
                px: 4,
                boxShadow: plan.highlight ? "0 2px 12px 0 #2563eb22" : "none",
                bgcolor: plan.highlight ? "#2563eb" : undefined,
                color: plan.highlight ? "#fff" : "#2563eb",
                borderColor: "#2563eb",
                '&:hover': {
                  bgcolor: plan.highlight ? "#174bbd" : "#f0f6ff",
                  borderColor: "#174bbd"
                }
              }}
            >
              Choose Plan
            </Button>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
}

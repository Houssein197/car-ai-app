import { useState } from "react";
import { useRouter } from "next/router";
import { createClient } from "@supabase/supabase-js";
import {
  Box, Button, TextField, Typography, Paper, CircularProgress, Link
} from "@mui/material";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }
    router.push("/dashboard");
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f7fafd", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 4, minWidth: 340, maxWidth: 400 }}>
        <Typography variant="h4" fontWeight={700} color="primary" mb={2} textAlign="center">
          Log In
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={3} textAlign="center">
          Access your account.
        </Typography>
        <Box component="form" onSubmit={handleLogin} noValidate>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            fullWidth
            margin="normal"
            required
            autoComplete="email"
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            fullWidth
            margin="normal"
            required
            autoComplete="current-password"
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2, fontWeight: 700, borderRadius: 2 }}
            disabled={loading}
            size="large"
          >
            {loading ? <CircularProgress size={22} sx={{ color: "#fff" }} /> : "Log In"}
          </Button>
          {error && (
            <Typography color="error" mt={2} textAlign="center">{error}</Typography>
          )}
        </Box>
        <Typography mt={3} textAlign="center" color="text.secondary" fontSize={15}>
          Don't have an account?{' '}
          <Link href="/signup" underline="hover" color="primary.main" fontWeight={600}>
            Sign up
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
} 
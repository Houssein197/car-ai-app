import { useRouter } from "next/router";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import DirectionsCarFilledIcon from '@mui/icons-material/DirectionsCarFilled';

export default function Home() {
  const router = useRouter();

  return (
    <Box sx={{ bgcolor: '#fff', minHeight: '100vh', pb: 8 }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: '#fff', color: '#2563eb', boxShadow: 'none', borderBottom: '1px solid #e5eaf2' }}>
        <Toolbar>
          <DirectionsCarFilledIcon sx={{ fontSize: 32, color: '#2563eb', mr: 1 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 800, letterSpacing: 1, color: '#2563eb' }}>
            autopic.ai
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ py: { xs: 6, md: 10 } }}>
        {/* Hero section */}
        <Box textAlign="center" mb={8}>
          <Typography variant="h1" fontWeight={800} color="#2563eb" gutterBottom sx={{ fontSize: { xs: 36, md: 56 } }}>
            Transform your car photos<br />into <Box component="span" color="#2563eb">premium showroom</Box> images
          </Typography>
          <Typography variant="h5" color="#222" mb={5}>
            Instantly upgrade your listings and sell faster with <Box component="span" color="#2563eb">autopic.ai</Box>.
          </Typography>
          <Button
            onClick={() => router.push("/pricing")}
            variant="contained"
            size="large"
            sx={{
              px: 6, py: 2, fontWeight: 700, fontSize: '1.2rem', borderRadius: 3,
              bgcolor: '#2563eb', color: '#fff', boxShadow: 'none',
              '&:hover': { bgcolor: '#174bbd' }
            }}
          >
            Get Started
          </Button>
        </Box>
        {/* Features section */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} justifyContent="center" alignItems="stretch" mb={8}>
          {[{
            title: 'AI-enhanced quality',
            desc: 'Our AI polishes every detail to give your photos a true luxury showroom feel.'
          }, {
            title: 'Fast and effortless',
            desc: 'Upload, process, and download — all in under a minute.'
          }, {
            title: 'Designed for dealerships',
            desc: 'Built to help you stand out and move inventory faster.'
          }].map((f, i) => (
            <Paper key={f.title} elevation={0} sx={{
              flex: '1 1 250px',
              maxWidth: 320,
              mx: 'auto',
              p: 4,
              borderRadius: 3,
              bgcolor: '#fff',
              border: '1px solid #e5eaf2',
              boxShadow: 'none',
              textAlign: 'left',
              minHeight: 180
            }}>
              <Typography variant="h6" mb={1} color="#2563eb" fontWeight={700}>{f.title}</Typography>
              <Typography color="#222" fontSize={16}>
                {f.desc}
              </Typography>
            </Paper>
          ))}
        </Stack>
        {/* Testimonials placeholder */}
        <Box textAlign="center" mb={8}>
          <Typography variant="h4" fontWeight={700} color="#2563eb" mb={2}>
            Loved by dealerships and car sellers
          </Typography>
          <Typography color="#222" fontWeight={500} fontSize={20}>
            “autopic.ai helped us increase inquiries by 45% — it really makes listings pop!”
          </Typography>
        </Box>
        {/* Footer */}
        <Box textAlign="center" mt={10} color="#94a3b8" fontSize={16}>
          <Typography variant="body2">
            © {new Date().getFullYear()} <Box component="span" color="#2563eb" fontWeight={700}>autopic.ai</Box> — All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

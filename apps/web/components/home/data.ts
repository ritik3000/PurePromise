export const features = [
  {
    icon: "camera",
    title: "Wedding-Ready Quality",
    description: "Professional pre-wedding photos generated in seconds",
    gradient: "from-rose-500 to-pink-500",
  },
  {
    icon: "wand",
    title: "Magic Editing",
    description: "Advanced AI tools to perfect every detail",
    gradient: "from-pink-500 to-rose-400",
  },
  {
    icon: "users",
    title: "Couple Collections",
    description: "Create stunning pre-wedding photos for couples",
    gradient: "from-amber-500 to-rose-500",
  },
  {
    icon: "clock",
    title: "Instant Delivery",
    description: "Get your pre-wedding photos in minutes, not days",
    gradient: "from-rose-400 to-amber-400",
  },
];

// Sample avatar URLs (DiceBear – unique avatar per author from name seed)
const avatarUrl = (name: string) =>
  `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(name)}&size=200`;

export const testimonials = [
  {
    text: "I wanted something elegant, not overdone. The photos felt very real and respectful of our traditions. It was a lovely experience.",
    author: "Indu Bhatt",
    role: "Teacher",
    avatar: avatarUrl("Indu Bhatt"),
  },
  {
    text: "The best part was how easy the whole process was. Selecting outfits, poses, and then getting a complete video at the end made it totally worth it.",
    author: "Ankit ",
    role: "Sales Manager",
    avatar: avatarUrl("Nisha Agrawal"),
  },
  {
    text: "We donʼt usually spend too much on photoshoots, but this was very reasonable and the output was better than expected. The locations and poses felt authentic.",
    author: "Rahul Verma",
    role: "Software Engineer",
    avatar: avatarUrl("Rahul Verma"),
  },
];

export const carouselImages = [
  {
    url: "https://purepromise.s3.ap-south-1.amazonaws.com/models/ritikurvashi7.jpg",
    title: "Fashion Forward",
    description: "Stylish pre-wedding photography for modern couples",
    style: "Fashion",
  },
  {
    url: "https://purepromise.s3.ap-south-1.amazonaws.com/models/ritikurvashi17.jpg",
    title: "Elegant Pre-Wedding",
    description: "Timeless couple photos perfect for your wedding album",
    style: "Elegant",
  },
  {
    url: "https://purepromise.s3.ap-south-1.amazonaws.com/models/ankitindufinal.jpg",
    title: "Romantic Lifestyle",
    description: "Natural and intimate pre-wedding moments",
    style: "Romantic",
  },
  {
    url: "https://purepromise.s3.ap-south-1.amazonaws.com/models/rufinal1.jpg",
    title: "Creative Couple",
    description: "Artistic pre-wedding shots with unique styling",
    style: "Creative",
  },
];

export const brands = [
  {
    name: "Company 1",
    logo: "https://media.licdn.com/dms/image/v2/D563DAQFdWbNq8YmjeA/image-scale_191_1128/image-scale_191_1128/0/1721141166811/100xdevs_cover?e=2147483647&v=beta&t=a1Ox9U8BLucp5rHxhTXRmUhMoMAKTDrs-IyjT547lPQ",
  },
  { name: "Company 2", logo: "/logos/logo2.svg" },
  { name: "Company 3", logo: "/logos/logo3.svg" },
  { name: "Company 4", logo: "/logos/logo4.svg" },
];

export const stats = [
  { value: "50+", label: "Pre-Wedding Photos Generated" },
  { value: "8+", label: "Happy Couples" },
  { value: "80%", label: "Satisfaction Rate" },
  { value: "24/7", label: "AI Support" },
];

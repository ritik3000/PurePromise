export const features = [
  {
    icon: "camera",
    title: "Studio Quality",
    description: "Professional couple photos generated in seconds",
    gradient: "from-rose-500 to-pink-500",
  },
  {
    icon: "users",
    title: "Couple Collections",
    description: "Create stunning couple photos for you and your partner",
    gradient: "from-amber-500 to-rose-500",
  },
  {
    icon: "clock",
    title: "Instant Delivery",
    description: "Get your couple photos in minutes, not days",
    gradient: "from-rose-400 to-amber-400",
  },
  {
    icon: "wand",
    title: "Data is safe and secure",
    description: "Your photos and data are protected with industry-standard security",
    gradient: "from-pink-500 to-rose-400",
  }
];

// Sample avatar URLs (DiceBear – unique avatar per author from name seed)
const avatarUrl = (name: string) =>
  `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(name)}&size=200`;

export const testimonials = [
  {
    text: "Beautiful memories created so effortlessly, we truly loved every single photo. The whole experience felt very special and meaningful for us.",
    author: "Indu Bhatt",
    role: "Teacher",
    avatar: avatarUrl("Indu Bhatt"),
  },
  {
    text: "Everything looked so real and elegant, and the process was unbelievably easy to use. It felt like our moments were captured perfectly without any stress.",
    author: "Ankit",
    role: "Sales Manager",
    avatar: avatarUrl("Nisha Agrawal"),
  },
  {
    text: "This is honestly the easiest way to create beautiful memories as a couple. The results felt natural, warm, and something we would love to keep forever.",
    author: "Rahul Verma",
    role: "Software Engineer",
    avatar: avatarUrl("Rahul Verma"),
  },
];

export const carouselImages = [
  {
    url: "https://purepromise.s3.ap-south-1.amazonaws.com/models/valentine1.jpeg",
    title: "Fashion Forward",
    description: "Stylish couple photography for modern pairs",
    style: "Fashion",
  },
  {
    url: "https://purepromise.s3.ap-south-1.amazonaws.com/models/ankitindufinal21.jpg",
    title: "Elegant Couple",
    description: "Timeless couple photos perfect for your album",
    style: "Elegant",
  },
  {
    url: "https://purepromise.s3.ap-south-1.amazonaws.com/models/europe3.jpeg",
    title: "Creative Couple",
    description: "Artistic couple shots with unique styling",
    style: "Creative",
  },
  {
    url: "https://purepromise.s3.ap-south-1.amazonaws.com/models/valentine3.jpeg",
    title: "Romantic Lifestyle",
    description: "Natural and intimate couple moments",
    style: "Romantic",
  }
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
  { value: "1000+", label: "Couple Photos Generated" },
  { value: "100+", label: "Happy Couples" },
  { value: "95%", label: "Satisfaction Rate" },
  { value: "24/7", label: "AI Support" },
];

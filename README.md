# RPH Interactive Learning Hub

A comprehensive interactive learning platform built with HTML, CSS, and JavaScript, powered by Supabase for backend services.

## Features

- 📚 **Topic Management** - Create, edit, and organize course topics
- 🖼️ **Rich Media Support** - Upload images and resources to topics
- 👥 **Class Management** - Manage classes and student enrollments
- 📝 **Quizzes & Assignments** - Create and take interactive assessments
- 🎮 **Gamification** - Leaderboards, points, and achievements
- 🔐 **Secure Authentication** - Supabase Auth with role-based access control
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Styling**: Tailwind CSS
- **Icons**: Lucide Icons
- **Hosting**: Vercel (Static Site)

## Local Development

### Prerequisites
- Node.js 18.x or higher
- A Supabase account and project

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Carlowsszxz/RPH-Interactive-Learning-Hub.git
   cd RPH-Interactive-Learning-Hub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:3000`

## Getting Supabase Credentials

1. Go to [Supabase](https://supabase.com)
2. Create a new project or use an existing one
3. Go to **Project Settings → API**
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** → `VITE_SUPABASE_ANON_KEY`

## Deployment on Vercel

### Step 1: Push to GitHub
Make sure your code is committed and pushed to GitHub.

### Step 2: Deploy to Vercel

**Option A: Using Vercel CLI**
```bash
npm install -g vercel
vercel
```

**Option B: Using Vercel Dashboard**
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Click "Deploy"

### Step 3: Configure Environment Variables in Vercel

1. In Vercel Dashboard, go to your project
2. Click **Settings → Environment Variables**
3. Add these variables:
   - `VITE_SUPABASE_URL` = Your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = Your Supabase anonymous key

4. Redeploy your project

### Step 4: Configure Supabase

In your Supabase project settings, add your Vercel domain to allowed URLs:
1. **Authentication → URL Configuration**
2. Add: `https://your-app-name.vercel.app`

## Project Structure

```
├── TEMPLATES/          # HTML page templates
├── JS/                 # JavaScript modules
├── CSS/                # Stylesheets
├── IMAGES/             # Static images
├── OTHERS/             # SQL scripts and configurations
├── vercel.json         # Vercel deployment configuration
├── package.json        # Node.js dependencies
├── .env.example        # Environment variables template
└── tailwind.config.js  # Tailwind CSS configuration
```

## Key Files

- **Authentication**: `JS/auth.js`, `JS/supabase-auth.js`
- **Topic Management**: `JS/uploadtopic.js`, `JS/topicedit.js`, `JS/topicmanagement.js`
- **Class Details**: `JS/classdetail.js`, `JS/classdetail-data.js`
- **Navigation**: `JS/navigation-loader.js`
- **Database**: `OTHERS/schema.sql`, `OTHERS/rls-policies-*.sql`

## Security

- ✅ **Parameterized Queries** - Supabase client prevents SQL injection
- ✅ **Row Level Security (RLS)** - Database policies enforce access control
- ✅ **Input Validation** - All user inputs are validated
- ✅ **XSS Protection** - HTML escaping on all user-generated content
- ✅ **HTTPS Only** - All connections are encrypted
- ✅ **Environment Variables** - Sensitive data never hardcoded

## Database Setup

The project requires these tables in Supabase:
- `users`
- `user_profiles`
- `classes`
- `class_enrollments`
- `topics`
- `class_resources`
- And others (see `OTHERS/schema.sql`)

Run the SQL files in your Supabase SQL Editor to set up the database.

## Troubleshooting

### Images not showing
- Check that the 'images' bucket exists in Supabase Storage
- Verify storage RLS policies allow public read access

### Authentication issues
- Ensure Supabase URL and key are correct in environment variables
- Check that your app domain is in Supabase URL configuration

### Database errors
- Verify RLS policies are correctly set up (see `OTHERS/rls-policies-*.sql`)
- Check user roles in `user_profiles` table

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes and commit: `git commit -am 'Add feature'`
3. Push to the branch: `git push origin feature/your-feature`
4. Some a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: [Project Issues](https://github.com/Carlowsszxz/RPH-Interactive-Learning-Hub/issues)
- Email: support@example.com

## Roadmap

- [ ] Mobile app versions (React Native)
- [ ] Real-time collaboration features
- [ ] Advanced analytics dashboard
- [ ] API documentation
- [ ] Admin panel improvements
- [ ] Multi-language support

---

**Built with ❤️ for educators and learners**

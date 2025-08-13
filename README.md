
# 🎊 Wedding Invitation Admin System

A comprehensive wedding invitation management system with admin panel, built with modern web technologies.

## 🌟 Features

### 🏠 **Public Wedding Website**
- Beautiful, responsive wedding invitation website
- Countdown timer to wedding day
- Wedding details and venue information
- RSVP functionality for guests
- Photo gallery and couple story
- Multiple theme support

### 🔧 **Admin Panel**
- **Dashboard**: Real-time analytics and insights
- **User Management**: Create, edit, and manage system users
- **Guest Management**: Complete RSVP and guest list management
- **Event Management**: Organize ceremony and reception details with interactive maps
- **Email Campaign**: Send bulk emails to guests with templates
- **Location Management**: Interactive map integration for venue management
- **Theme Editor**: Customize website appearance and branding
- **Analytics**: Track visitor engagement and RSVP responses
- **Settings**: Configure application preferences

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI library
- **TypeScript** - Type safety and developer experience
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality UI components
- **React Router** - Client-side routing
- **React Query** - Data fetching and state management
- **Leaflet** - Interactive maps

### Backend & Database
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Database
- **Row Level Security (RLS)** - Data security
- **Edge Functions** - Serverless functions

### Email Service
- **Resend** - Email delivery service

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Resend account (for email features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd wedding-invitation-admin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup**
   - Create a new Supabase project
   - Run the SQL migrations found in `supabase/migrations/`
   - Configure Row Level Security policies

5. **Email Service Setup** (Optional)
   - Sign up for Resend.com
   - Add your domain and verify it
   - Create an API key
   - Add `RESEND_API_KEY` to your Supabase Edge Function secrets

6. **Start Development Server**
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
wedding-invitation-admin/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── admin/          # Admin panel components
│   │   └── ui/             # shadcn/ui components
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Page components
│   │   └── admin/          # Admin panel pages
│   ├── utils/              # Utility functions
│   └── integrations/       # External service integrations
│       └── supabase/       # Supabase configuration
├── supabase/
│   ├── migrations/         # Database migrations
│   └── functions/          # Edge functions
└── public/                 # Static assets
```

## 📊 Database Schema

### Core Tables
- `app_users` - System users and authentication
- `wedding_hero_settings` - Homepage configuration
- `email_campaigns` - Email campaign management
- `email_templates` - Email template storage

### Security
- Row Level Security (RLS) enabled on all tables
- User-based access control
- Secure API endpoints

## 🎨 Admin Panel Features

### Dashboard
- Real-time visitor analytics
- RSVP statistics
- Recent guest activities
- Quick action shortcuts

### User Management
- Create and manage admin users
- Role-based access control (Admin, Moderator, User)
- User activation/deactivation
- Email verification status

### Guest Management
- Complete guest database
- RSVP tracking and management
- Dietary requirements and special needs
- Guest contact information
- Export guest lists

### Event Management
- Ceremony and reception details
- Interactive venue selection with maps
- Event scheduling and timing
- Contact person management
- Dress code specifications

### Email Campaigns
- Bulk email sending to guests
- Template management
- Campaign tracking and analytics
- Recipient grouping and filtering
- Email delivery status

### Location Management
- Interactive map integration
- Multiple venue support
- GPS coordinates
- Venue details and capacity
- Amenities tracking

### Theme Customization
- Real-time theme preview
- Color scheme customization
- Typography settings
- Layout configurations
- Mobile responsiveness

## 🔐 Authentication & Security

- Secure user authentication
- Role-based access control
- Row Level Security (RLS) policies
- Session management
- Password reset functionality
- Email verification

## 📧 Email Integration

The system includes comprehensive email functionality:

### Setup Requirements
1. **Resend Account**: Sign up at [resend.com](https://resend.com)
2. **Domain Verification**: Verify your sending domain
3. **API Key**: Generate and configure your API key

### Features
- **Campaign Management**: Create and manage email campaigns
- **Template System**: Design reusable email templates
- **Recipient Grouping**: Target specific guest groups
- **Delivery Tracking**: Monitor email delivery status
- **Analytics**: Track open rates and engagement

## 🗺️ Map Integration

Interactive maps powered by Leaflet:
- **Venue Selection**: Point-and-click venue selection
- **GPS Coordinates**: Automatic coordinate detection
- **Multiple Locations**: Support for ceremony and reception venues
- **Directions**: Integration with mapping services
- **Mobile Friendly**: Responsive map interface

## 🎯 Configuration

### Wedding Hero Settings
Configure the main wedding invitation page:
- Bride and groom names
- Wedding date and time
- Venue information
- Hero image and descriptions
- Countdown timer settings

### Email Templates
Customize email communications:
- Welcome messages
- RSVP confirmations
- Event reminders
- Thank you notes

## 📱 Responsive Design

The entire system is built with mobile-first approach:
- **Desktop**: Full-featured admin interface
- **Tablet**: Optimized layouts and navigation
- **Mobile**: Touch-friendly interface with essential features

## 🔄 Data Management

### Backup & Restore
- Automated database backups
- Export functionality for all data
- Import/restore capabilities

### Analytics & Reporting
- Visitor tracking and analytics
- RSVP response rates
- Email campaign performance
- Guest engagement metrics

## 🚀 Deployment

### Recommended Deployment
1. **Frontend**: Deploy to Vercel, Netlify, or similar
2. **Backend**: Supabase handles all backend infrastructure
3. **Domain**: Configure custom domain in deployment platform

### Environment Variables
Ensure these are set in your deployment:
```
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_supabase_anon_key
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
1. Check the [Issues](../../issues) page
2. Create a new issue with detailed description
3. Include error messages and steps to reproduce

## 🎉 Acknowledgments

- Built with [React](https://reactjs.org/)
- UI components by [shadcn/ui](https://ui.shadcn.com/)
- Backend by [Supabase](https://supabase.com/)
- Maps by [Leaflet](https://leafletjs.com/)
- Email service by [Resend](https://resend.com/)

---

**Made with ❤️ for perfect wedding celebrations**

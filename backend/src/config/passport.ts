import passport from 'passport';
import { Strategy as LineStrategy } from 'passport-line';
import prisma from '../lib/prisma';

// Configure LINE Strategy
passport.use(
  new LineStrategy(
    {
      channelID: process.env.LINE_CHANNEL_ID || '',
      channelSecret: process.env.LINE_CHANNEL_SECRET || '',
      callbackURL: process.env.LINE_CALLBACK_URL || 'http://localhost:5001/auth/line/callback',
      scope: 'profile openid email',
    } as any,
    async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        console.log('LINE Profile:', profile);

        // Check if user exists
        let user = await prisma.user.findFirst({
          where: {
            OR: [
              { lineId: profile.id },
              { email: profile.email || undefined },
            ],
          },
        });

        if (!user) {
          // Create new user
          user = await prisma.user.create({
            data: {
              lineId: profile.id,
              email: profile.email || null,
              fullName: profile.displayName || null,
              profilePicture: profile.pictureUrl || null,
              role: 'user', // Default role
            },
          });

          console.log('Created new user:', user.id);
        } else if (!user.lineId) {
          // Update existing user with LINE ID
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              lineId: profile.id,
              profilePicture: profile.pictureUrl || user.profilePicture,
            },
          });

          console.log('Updated user with LINE ID:', user.id);
        }

        // Try to link with customer record
        const customer = await prisma.customer.findFirst({
          where: {
            lineId: profile.id,
          },
        });

        if (customer && !customer.userId) {
          await prisma.customer.update({
            where: { id: customer.id },
            data: { userId: user.id },
          });
          console.log('Linked customer to user:', customer.id);
        }

        return done(null, user);
      } catch (error) {
        console.error('Error in LINE strategy:', error);
        return done(error, null);
      }
    }
  )
);

// Serialize user to session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        customers: true,
      },
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;

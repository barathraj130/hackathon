const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Script to create a default admin user
// Run this once to create an admin account

async function createAdminUser() {
  const adminEmail = 'admin@hackathon.com';
  const adminPassword = 'admin123';
  const adminName = 'Admin User';

  try {
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const adminUser = {
      id: uuidv4(),
      email: adminEmail,
      passwordHash: passwordHash,
      name: adminName,
      role: 'ADMIN',
      createdAt: new Date().toISOString()
    };

    // Add to global.db if server is running
    // Note: Since this is a standalone script, we can't easily push to the running server's memory
    // unless we expose an endpoint or use a persistent DB.
    // For this prototype, I'll recommend the user restarts the server after pasting this into server.js
    // OR I will simply use a curl command to register a user then elevate them if I could.
    
    // BETTER APPROACH for this specific in-memory setup:
    // I will Create a tool to hit the register endpoint then manually elevate them via a new secret endpoint? 
    // No, I'll just output the object and ask to paste it, OR I'll add a 'seed' endpoint.
    
    console.log('To create an admin user, please add this object to your global.db.users array in backend/server.js:');
    console.log(JSON.stringify(adminUser, null, 2));
    
    // Alternatively, for the user's convenience, I will create a temporary "setup" route in the server
    // that creates this user.
  } catch (error) {
    console.error('Error creating admin:', error);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  createAdminUser();
}

module.exports = createAdminUser;

#!/usr/bin/env node

/**
 * Script to help set up Twilio phone number and proxy service
 * Run: node scripts/setup-twilio.js
 */

import dotenv from 'dotenv';
import twilio from 'twilio';
import { createInterface } from 'readline';
import { promisify } from 'util';

// Load environment variables
config({ path: '.env.local' });

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSid || !authToken) {
  console.error('❌ Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN in .env.local');
  process.exit(1);
}

const client = new Twilio(accountSid, authToken);
const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = promisify(rl.question).bind(rl);

async function main() {
  try {
    console.log('🚀 Twilio Setup Assistant\n');

    // Check account balance
    const account = await client.api.v2010.accounts(accountSid).fetch();
    console.log(`📊 Account Status: ${account.status}`);
    
    // Get balance (this might fail for trial accounts)
    try {
      const balance = await client.balance.fetch();
      console.log(`💰 Balance: ${balance.currency} ${balance.balance}\n`);
    } catch (e) {
      console.log('💰 Balance: Trial account (unable to fetch exact balance)\n');
    }

    // Step 1: List available phone numbers
    const country = await question('Enter country code (US, UK, CA, AU) [US]: ') || 'US';
    
    console.log(`\n🔍 Searching for available ${country} phone numbers...`);
    const availableNumbers = await client.availablePhoneNumbers(country)
      .local
      .list({ 
        voiceEnabled: true,
        smsEnabled: true,
        limit: 10 
      });

    if (availableNumbers.length === 0) {
      console.log('❌ No numbers available in this country');
      process.exit(1);
    }

    console.log('\nAvailable numbers:');
    availableNumbers.forEach((num, idx) => {
      console.log(`${idx + 1}. ${num.phoneNumber} - ${num.locality}, ${num.region}`);
    });

    const choice = await question('\nSelect a number (1-10) or press Enter to skip: ');
    
    let phoneNumber = null;
    if (choice && parseInt(choice) > 0) {
      const selected = availableNumbers[parseInt(choice) - 1];
      
      console.log(`\n📞 Purchasing ${selected.phoneNumber}...`);
      try {
        const purchased = await client.incomingPhoneNumbers.create({
          phoneNumber: selected.phoneNumber,
          friendlyName: 'Contact Manager PWA'
        });
        phoneNumber = purchased.phoneNumber;
        console.log(`✅ Successfully purchased: ${phoneNumber}`);
      } catch (error) {
        console.error('❌ Failed to purchase number:', error.message);
      }
    }

    // Step 2: Create or list Proxy Services
    console.log('\n🔧 Setting up Proxy Service...');
    
    const services = await client.proxy.v1.services.list({ limit: 20 });
    
    if (services.length > 0) {
      console.log('\nExisting Proxy Services:');
      services.forEach((service, idx) => {
        console.log(`${idx + 1}. ${service.uniqueName} (${service.sid})`);
      });
      
      const useExisting = await question('\nUse existing service? (y/N): ');
      if (useExisting.toLowerCase() === 'y') {
        const serviceChoice = await question('Select service number: ');
        const selectedService = services[parseInt(serviceChoice) - 1];
        
        console.log(`\n✅ Using Proxy Service: ${selectedService.sid}`);
        console.log('\nAdd these to your .env.local:');
        console.log(`VITE_TWILIO_PROXY_SERVICE_SID=${selectedService.sid}`);
        if (phoneNumber) {
          console.log(`VITE_TWILIO_PHONE_${country}=${phoneNumber}`);
        }
        
        rl.close();
        return;
      }
    }

    // Create new Proxy Service
    const serviceName = await question('Enter Proxy Service name [contact-manager-proxy]: ') || 'contact-manager-proxy';
    
    console.log(`\n🏗️  Creating Proxy Service: ${serviceName}...`);
    const proxyService = await client.proxy.v1.services.create({
      uniqueName: serviceName,
      callbackUrl: 'https://contact-manager-pwa.pages.dev/api/telephony/webhook/voice'
    });

    console.log(`✅ Created Proxy Service: ${proxyService.sid}`);

    // Add phone number to proxy service if we purchased one
    if (phoneNumber) {
      console.log(`\n🔗 Adding phone number to Proxy Service...`);
      try {
        await client.proxy.v1
          .services(proxyService.sid)
          .phoneNumbers
          .create({ phoneNumber });
        console.log('✅ Phone number added to Proxy Service');
      } catch (error) {
        console.error('❌ Failed to add number to proxy:', error.message);
      }
    }

    // Final output
    console.log('\n🎉 Setup Complete!\n');
    console.log('Add these to your .env.local:');
    console.log(`VITE_TWILIO_PROXY_SERVICE_SID=${proxyService.sid}`);
    if (phoneNumber) {
      console.log(`VITE_TWILIO_PHONE_${country}=${phoneNumber}`);
    }
    
    console.log('\n📝 Next steps:');
    console.log('1. Add the environment variables above to .env.local');
    console.log('2. Deploy the telephony worker: cd workers/telephony && npm run deploy');
    console.log('3. Update webhook URLs in Twilio Console');
    console.log('4. For trial accounts: Add verified numbers in Twilio Console');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

main();
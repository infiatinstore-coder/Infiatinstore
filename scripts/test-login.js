/**
 * Test Admin Login
 */

async function testLogin() {
    try {
        console.log('🧪 Testing admin login...\n');

        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@infiatin.store',
                password: 'admin123'
            })
        });

        const data = await response.json();

        console.log('Response Status:', response.status);
        console.log('Response Data:', JSON.stringify(data, null, 2));

        if (response.ok && data.success) {
            console.log('\n✅ LOGIN SUCCESS!');
            console.log('User:', data.user.name);
            console.log('Role:', data.user.role);
            console.log('Email:', data.user.email);
        } else {
            console.log('\n❌ LOGIN FAILED!');
            console.log('Error:', data.error || 'Unknown error');
        }

    } catch (error) {
        console.error('❌ Test error:', error.message);
    }
}

testLogin();

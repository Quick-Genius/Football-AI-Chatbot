// Simple integration test for the Football AI Chatbot
const API_URL = 'http://localhost:5001/api';

async function testBackendConnection() {
    console.log('🔧 Testing backend connection...');
    
    try {
        // Test health endpoint
        const healthResponse = await fetch(`${API_URL}/health`);
        const healthData = await healthResponse.json();
        console.log('✅ Health check:', healthData);
        
        // Test chat endpoint
        const chatResponse = await fetch(`${API_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: 'Tell me about Premier League' })
        });
        
        const chatData = await chatResponse.json();
        console.log('✅ Chat response received:', chatData.response ? 'Success' : 'Failed');
        console.log('📝 Response preview:', chatData.response?.substring(0, 100) + '...');
        
        return true;
    } catch (error) {
        console.error('❌ Backend test failed:', error.message);
        return false;
    }
}

async function testFrontendConnection() {
    console.log('🌐 Testing frontend connection...');
    
    try {
        const response = await fetch('http://localhost:5173');
        const html = await response.text();
        
        if (html.includes('Football AI Chatbot')) {
            console.log('✅ Frontend is serving correctly');
            return true;
        } else {
            console.log('❌ Frontend title not found');
            return false;
        }
    } catch (error) {
        console.error('❌ Frontend test failed:', error.message);
        return false;
    }
}

async function runTests() {
    console.log('🚀 Starting integration tests...\n');
    
    const backendOk = await testBackendConnection();
    console.log('');
    const frontendOk = await testFrontendConnection();
    
    console.log('\n📊 Test Results:');
    console.log(`Backend: ${backendOk ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Frontend: ${frontendOk ? '✅ PASS' : '❌ FAIL'}`);
    
    if (backendOk && frontendOk) {
        console.log('\n🎉 All tests passed! The application is ready to use.');
        console.log('🌐 Frontend: http://localhost:5173');
        console.log('🔧 Backend: http://localhost:5001');
    } else {
        console.log('\n⚠️  Some tests failed. Please check the server status.');
    }
}

// Run tests if this script is executed directly
if (typeof window === 'undefined') {
    runTests();
}
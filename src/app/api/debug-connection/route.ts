import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('🔍 Starting debug connection test...');
    
    // Test 1: Basic Supabase client creation
    console.log('✅ Supabase client created successfully');
    
    // Test 2: Very basic query - just check if we can connect
    const { data: basicTest, error: basicError } = await supabase
      .from('documents')
      .select('count', { count: 'exact', head: true });
      
    if (basicError) {
      console.error('❌ Basic query failed:', basicError);
      return NextResponse.json({
        success: false,
        error: 'Basic query failed',
        details: {
          code: basicError.code,
          message: basicError.message,
          details: basicError.details,
          hint: basicError.hint
        }
      });
    }
    
    console.log('✅ Basic query successful, count:', basicTest);
    
    // Test 3: Check if tables exist
    const { data: tablesTest, error: tablesError } = await supabase
      .rpc('check_table_exists', { table_name: 'documents' });
      
    if (tablesError) {
      console.log('⚠️ Table existence check failed (expected if RPC not created)');
    }
    
    // Test 4: List all tables (alternative approach)
    const { data: schemaTest, error: schemaError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE');
      
    if (schemaError) {
      console.log('⚠️ Schema query failed:', schemaError.message);
    } else {
      console.log('📋 Available tables:', schemaTest?.map(t => t.table_name));
    }
    
    return NextResponse.json({
      success: true,
      message: 'Connection successful',
      details: {
        documentsTableCount: basicTest,
        availableTables: schemaTest?.map(t => t.table_name) || []
      }
    });
    
  } catch (error) {
    console.error('❌ Debug test failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Connection test failed',
      details: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error
    }, { status: 500 });
  }
}

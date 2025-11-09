"""
Run Database Endpoint Tests

This script runs the complete test suite for database CRUD operations.
It uses mocked Supabase calls to verify API endpoints work correctly.
"""

import sys
import subprocess


def run_tests():
    """Run the test suite with pytest."""
    
    print("="*80)
    print("🧪 RUNNING DATABASE ENDPOINT TESTS")
    print("="*80)
    print("\nThis test suite verifies:")
    print("  ✓ API endpoints receive requests correctly")
    print("  ✓ Data is transformed properly before reaching Supabase")
    print("  ✓ Supabase client methods are called with correct parameters")
    print("  ✓ Responses are formatted correctly")
    print("\n" + "="*80 + "\n")
    
    # Run pytest with verbose output
    result = subprocess.run(
        [
            sys.executable, "-m", "pytest",
            "tests/test_database_endpoints.py",
            "-v",  # Verbose
            "-s",  # Show print statements
            "--tb=short",  # Short traceback format
            "--color=yes"  # Colored output
        ],
        cwd="/app"
    )
    
    print("\n" + "="*80)
    if result.returncode == 0:
        print("✅ ALL TESTS PASSED!")
    else:
        print("❌ SOME TESTS FAILED")
    print("="*80)
    
    return result.returncode


if __name__ == "__main__":
    exit_code = run_tests()
    sys.exit(exit_code)


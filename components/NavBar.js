'use client';

import Link from 'next/link';
import { useState } from 'react';

const NavBar = ({ repos }) => {
  // Define the list of main repos
  const mainRepoNames = ['nbodysimulation','clashroyalebot','flappy-bird-plus-ai']; // Replace with your desired repo names
  const mainRepos = repos.filter((repo) => mainRepoNames.includes(repo.name));
  const otherRepos = repos.filter((repo) => !mainRepoNames.includes(repo.name));

  const [isDropdownOpen, setDropdownOpen] = useState(false);

  return (
    <>
      {/* Navigation Bar */}
      <nav style={{
        display: 'flex',
        gap: '10px',
        padding: '10px',
        alignItems: 'center', // Vertically center all content
        justifyContent: 'center',
        position: 'fixed', // Make the nav bar fixed at the top
        top: 0,
        left: 0,
        right: 0,
        height: '80px', // Set fixed height
        backgroundColor: '#fff', // Background color for the nav bar
        borderBottom: '1px solid #ddd', // Border at the bottom
        zIndex: 1000, // Ensure it appears above other content
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)', // Subtle shadow
      }}>
        {/* LC Home Button */}
        <Link
          href="/"
          style={{
            position: 'absolute', // Place it in the top-left corner inside the nav bar
            top: '10px',
            left: '10px',
            display: 'inline-block',
            width: '60px', // Adjust width
            height: '60px', // Adjust height
            backgroundColor: '#333', // Dark background
            color: '#fff', // White text
            textAlign: 'center', // Center text horizontally
            lineHeight: '60px', // Center text vertically
            textDecoration: 'none', // Remove underline
            fontWeight: 'bold', // Make text bold
            fontSize: '24px', // Large font size
            borderRadius: '50%', // Make it circular
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)', // Add a subtle shadow
          }}
        >
          LC
        </Link>

        {/* Main Repository Links */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginLeft: '80px', // Leave space for the LC button
        }}>
          {mainRepos.map((repo) => (
            <Link
              href={`/${repo.name}`}
              key={repo.id}
              style={{
                display: 'inline-block',
                width: '150px', // Fixed width
                height: '40px', // Fixed height
                backgroundColor: '#f4f4f4', // Light background
                textDecoration: 'none', // Remove underline
                color: '#333', // Text color
                borderRadius: '4px', // Rounded corners
                border: '1px solid #ccc', // Border for distinction
                textAlign: 'left', // Left-align text
                paddingLeft: '10px', // Add padding to separate text from border
                lineHeight: '40px', // Vertically center text within the box
                overflow: 'hidden', // Prevent text overflow
                whiteSpace: 'nowrap', // Prevent wrapping
                textOverflow: 'ellipsis', // Show ellipsis for long names
              }}
            >
              {repo.name}
            </Link>
          ))}
        </div>

        {/* Dropdown for Other Repositories */}
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
        }}>
          <button
            onClick={() => setDropdownOpen(!isDropdownOpen)}
            style={{
              backgroundColor: '#333',
              color: '#fff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            Other Repos
          </button>
          {isDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: '40px', // Position below the button
                right: '0',
                backgroundColor: '#fff',
                border: '1px solid #ccc',
                borderRadius: '4px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                zIndex: 1000,
              }}
            >
              {otherRepos.map((repo) => (
                <Link
                  href={`/${repo.name}`}
                  key={repo.id}
                  style={{
                    display: 'block',
                    padding: '10px 20px',
                    textDecoration: 'none',
                    color: '#333',
                    borderBottom: '1px solid #ddd',
                  }}
                  onClick={() => setDropdownOpen(false)} // Close dropdown on link click
                >
                  {repo.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Add Padding for Page Content */}
      <div style={{
        paddingTop: '80px', // Matches the height of the nav bar
      }}>
        {/* Content Placeholder */}
        <div>
          {/* Insert your page content here */}
        </div>
      </div>
    </>
  );
};

export default NavBar;

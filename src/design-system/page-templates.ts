/**
 * Page Templates for Builder.io using Design System Components
 * 
 * Pre-built page templates that demonstrate the full capability
 * of our design system components and provide quick starting points
 * for non-technical users.
 */

export interface BuilderTemplate {
  name: string;
  description: string;
  category: string;
  data: {
    blocks: any[];
  };
}

// Landing Page Template
export const landingPageTemplate: BuilderTemplate = {
  name: 'Design System Landing Page',
  description: 'Modern landing page showcasing all design system components',
  category: 'Landing Pages',
  data: {
    blocks: [
      {
        '@type': '@builder.io/sdk:Element',
        '@version': 2,
        id: 'header-section',
        component: {
          name: 'ds-card',
          options: {
            variant: 'elevated',
            padding: 'large',
            backgroundColor: '#ffffff',
            textColor: '#111827',
            interactive: false,
            alignment: 'center',
            contentDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '24px',
            minHeight: '400px'
          }
        },
        children: [
          {
            '@type': '@builder.io/sdk:Element',
            component: {
              name: 'Text',
              options: {
                text: '<h1 style="font-size: 3rem; font-weight: bold; margin: 0; text-align: center;">Welcome to Our Platform</h1>'
              }
            }
          },
          {
            '@type': '@builder.io/sdk:Element',
            component: {
              name: 'Text',
              options: {
                text: '<p style="font-size: 1.25rem; color: #6b7280; text-align: center; margin: 16px 0;">Experience the power of our design system with beautiful, accessible components.</p>'
              }
            }
          },
          {
            '@type': '@builder.io/sdk:Element',
            component: {
              name: 'ds-button',
              options: {
                text: 'Get Started',
                variant: 'primary',
                size: 'large',
                icon: 'arrow-right',
                iconPosition: 'right',
                primaryColor: '#2563eb',
                hoverColor: '#1d4ed8',
                borderRadius: 8
              }
            }
          }
        ]
      },
      // Features Section
      {
        '@type': '@builder.io/sdk:Element',
        '@version': 2,
        id: 'features-section',
        component: {
          name: 'Columns',
          options: {
            columns: [
              {
                blocks: [
                  {
                    '@type': '@builder.io/sdk:Element',
                    component: {
                      name: 'ds-card',
                      options: {
                        variant: 'default',
                        padding: 'medium',
                        interactive: true,
                        hoverEffect: 'lift',
                        header: 'Smart Forms',
                        alignment: 'center',
                        contentDirection: 'column',
                        gap: '16px'
                      }
                    },
                    children: [
                      {
                        '@type': '@builder.io/sdk:Element',
                        component: {
                          name: 'Text',
                          options: {
                            text: 'Advanced input components with built-in validation and beautiful styling.'
                          }
                        }
                      }
                    ]
                  }
                ]
              },
              {
                blocks: [
                  {
                    '@type': '@builder.io/sdk:Element',
                    component: {
                      name: 'ds-card',
                      options: {
                        variant: 'default',
                        padding: 'medium',
                        interactive: true,
                        hoverEffect: 'lift',
                        header: 'File Upload',
                        alignment: 'center',
                        contentDirection: 'column',
                        gap: '16px'
                      }
                    },
                    children: [
                      {
                        '@type': '@builder.io/sdk:Element',
                        component: {
                          name: 'Text',
                          options: {
                            text: 'Drag & drop file uploads with progress tracking and smart storage routing.'
                          }
                        }
                      }
                    ]
                  }
                ]
              },
              {
                blocks: [
                  {
                    '@type': '@builder.io/sdk:Element',
                    component: {
                      name: 'ds-card',
                      options: {
                        variant: 'default',
                        padding: 'medium',
                        interactive: true,
                        hoverEffect: 'lift',
                        header: 'Flexible Layout',
                        alignment: 'center',
                        contentDirection: 'column',
                        gap: '16px'
                      }
                    },
                    children: [
                      {
                        '@type': '@builder.io/sdk:Element',
                        component: {
                          name: 'Text',
                          options: {
                            text: 'Responsive cards and containers that adapt to any content and layout needs.'
                          }
                        }
                      }
                    ]
                  }
                ]
              }
            ]
          }
        }
      }
    ]
  }
};

// Contact Form Template
export const contactFormTemplate: BuilderTemplate = {
  name: 'Contact Form',
  description: 'Professional contact form with validation',
  category: 'Forms',
  data: {
    blocks: [
      {
        '@type': '@builder.io/sdk:Element',
        '@version': 2,
        id: 'contact-form',
        component: {
          name: 'ds-card',
          options: {
            variant: 'elevated',
            padding: 'large',
            maxWidth: '600px',
            header: 'Contact Us',
            alignment: 'left',
            contentDirection: 'column',
            gap: '24px'
          }
        },
        children: [
          {
            '@type': '@builder.io/sdk:Element',
            component: {
              name: 'ds-input',
              options: {
                label: 'Full Name',
                placeholder: 'Enter your full name',
                required: true,
                variant: 'outlined',
                size: 'medium',
                rules: '[{"type": "required", "message": "Name is required"}]'
              }
            }
          },
          {
            '@type': '@builder.io/sdk:Element',
            component: {
              name: 'ds-input',
              options: {
                label: 'Email Address',
                type: 'email',
                placeholder: 'Enter your email address',
                required: true,
                variant: 'outlined',
                size: 'medium',
                rules: '[{"type": "required"}, {"type": "email"}]'
              }
            }
          },
          {
            '@type': '@builder.io/sdk:Element',
            component: {
              name: 'ds-input',
              options: {
                label: 'Phone Number',
                type: 'tel',
                placeholder: 'Enter your phone number',
                variant: 'outlined',
                size: 'medium'
              }
            }
          },
          {
            '@type': '@builder.io/sdk:Element',
            component: {
              name: 'ds-input',
              options: {
                label: 'Message',
                placeholder: 'Tell us how we can help you...',
                required: true,
                variant: 'outlined',
                size: 'medium',
                rules: '[{"type": "required", "message": "Message is required"}]'
              }
            }
          },
          {
            '@type': '@builder.io/sdk:Element',
            component: {
              name: 'ds-file-upload',
              options: {
                uploadText: 'Attach files (optional)',
                multiple: true,
                accept: '.pdf,.doc,.docx,.jpg,.png',
                maxFileSize: 5,
                maxFiles: 3,
                height: '120px'
              }
            }
          },
          {
            '@type': '@builder.io/sdk:Element',
            component: {
              name: 'ds-button',
              options: {
                text: 'Send Message',
                variant: 'primary',
                size: 'large',
                fullWidth: true,
                icon: 'check',
                iconPosition: 'right'
              }
            }
          }
        ]
      }
    ]
  }
};

// Product Showcase Template
export const productShowcaseTemplate: BuilderTemplate = {
  name: 'Product Showcase',
  description: 'Product display with interactive cards',
  category: 'E-commerce',
  data: {
    blocks: [
      {
        '@type': '@builder.io/sdk:Element',
        '@version': 2,
        id: 'showcase-grid',
        component: {
          name: 'Columns',
          options: {
            columns: [
              {
                blocks: [
                  {
                    '@type': '@builder.io/sdk:Element',
                    component: {
                      name: 'ds-card',
                      options: {
                        variant: 'elevated',
                        padding: 'medium',
                        interactive: true,
                        hoverEffect: 'scale',
                        hoverScale: 1.05,
                        clickAction: 'custom',
                        backgroundImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
                        backgroundPosition: 'center',
                        backgroundSize: 'cover',
                        minHeight: '300px',
                        alignment: 'center',
                        contentDirection: 'column',
                        justifyContent: 'flex-end',
                        footer: 'Premium Headphones - $299'
                      }
                    },
                    children: [
                      {
                        '@type': '@builder.io/sdk:Element',
                        component: {
                          name: 'ds-button',
                          options: {
                            text: 'Add to Cart',
                            variant: 'primary',
                            size: 'medium',
                            icon: 'plus'
                          }
                        }
                      }
                    ]
                  }
                ]
              },
              {
                blocks: [
                  {
                    '@type': '@builder.io/sdk:Element',
                    component: {
                      name: 'ds-card',
                      options: {
                        variant: 'elevated',
                        padding: 'medium',
                        interactive: true,
                        hoverEffect: 'scale',
                        hoverScale: 1.05,
                        clickAction: 'custom',
                        backgroundImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
                        backgroundPosition: 'center',
                        backgroundSize: 'cover',
                        minHeight: '300px',
                        alignment: 'center',
                        contentDirection: 'column',
                        justifyContent: 'flex-end',
                        footer: 'Smart Watch - $199'
                      }
                    },
                    children: [
                      {
                        '@type': '@builder.io/sdk:Element',
                        component: {
                          name: 'ds-button',
                          options: {
                            text: 'Add to Cart',
                            variant: 'primary',
                            size: 'medium',
                            icon: 'plus'
                          }
                        }
                      }
                    ]
                  }
                ]
              },
              {
                blocks: [
                  {
                    '@type': '@builder.io/sdk:Element',
                    component: {
                      name: 'ds-card',
                      options: {
                        variant: 'elevated',
                        padding: 'medium',
                        interactive: true,
                        hoverEffect: 'scale',
                        hoverScale: 1.05,
                        clickAction: 'custom',
                        backgroundImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
                        backgroundPosition: 'center',
                        backgroundSize: 'cover',
                        minHeight: '300px',
                        alignment: 'center',
                        contentDirection: 'column',
                        justifyContent: 'flex-end',
                        footer: 'Running Shoes - $149'
                      }
                    },
                    children: [
                      {
                        '@type': '@builder.io/sdk:Element',
                        component: {
                          name: 'ds-button',
                          options: {
                            text: 'Add to Cart',
                            variant: 'primary',
                            size: 'medium',
                            icon: 'plus'
                          }
                        }
                      }
                    ]
                  }
                ]
              }
            ]
          }
        }
      }
    ]
  }
};

// File Upload Gallery Template (Enhanced)
export const fileUploadGalleryTemplate: BuilderTemplate = {
  name: 'File Upload Gallery',
  description: 'Advanced media management with upload, preview, and organization',
  category: 'Media',
  data: {
    blocks: [
      {
        '@type': '@builder.io/sdk:Element',
        '@version': 2,
        id: 'file-gallery',
        component: {
          name: 'ds-file-gallery',
          options: {
            title: 'Media Gallery',
            description: 'Upload, organize, and manage your files with advanced filtering and preview capabilities',
            allowUpload: true,
            allowDelete: true,
            allowPreview: true,
            showFilters: true,
            acceptedTypes: ['image/*', 'video/*', '.pdf', '.doc', '.docx', '.txt', '.zip'],
            maxFileSize: 25,
            maxFiles: 100
          }
        }
      }
    ]
  }
};

// Document Management Template
export const documentManagementTemplate: BuilderTemplate = {
  name: 'Document Management System',
  description: 'Professional document organization and collaboration',
  category: 'Business',
  data: {
    blocks: [
      {
        '@type': '@builder.io/sdk:Element',
        '@version': 2,
        id: 'document-manager',
        component: {
          name: 'ds-card',
          options: {
            variant: 'elevated',
            padding: 'large',
            header: 'Document Management',
            alignment: 'left',
            contentDirection: 'column',
            gap: '24px'
          }
        },
        children: [
          {
            '@type': '@builder.io/sdk:Element',
            component: {
              name: 'Text',
              options: {
                text: '<h3>Upload and Organize Documents</h3><p>Manage your business documents with advanced search, filtering, and collaboration features.</p>'
              }
            }
          },
          {
            '@type': '@builder.io/sdk:Element',
            component: {
              name: 'ds-file-gallery',
              options: {
                title: 'Document Library',
                description: 'Upload PDFs, Word documents, spreadsheets, and more',
                allowUpload: true,
                allowDelete: true,
                allowPreview: true,
                showFilters: true,
                acceptedTypes: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf'],
                maxFileSize: 50,
                maxFiles: 500
              }
            }
          }
        ]
      }
    ]
  }
};

// Media Portfolio Template
export const mediaPortfolioTemplate: BuilderTemplate = {
  name: 'Media Portfolio Gallery',
  description: 'Showcase your work with a professional media gallery',
  category: 'Portfolio',
  data: {
    blocks: [
      {
        '@type': '@builder.io/sdk:Element',
        '@version': 2,
        id: 'portfolio-header',
        component: {
          name: 'ds-card',
          options: {
            variant: 'elevated',
            padding: 'large',
            backgroundImage: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=1200',
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            minHeight: '300px',
            alignment: 'center',
            contentDirection: 'column',
            justifyContent: 'center',
            textColor: '#ffffff'
          }
        },
        children: [
          {
            '@type': '@builder.io/sdk:Element',
            component: {
              name: 'Text',
              options: {
                text: '<h1 style="font-size: 3rem; text-align: center; margin: 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">Creative Portfolio</h1><p style="font-size: 1.25rem; text-align: center; margin: 16px 0 0; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);">Showcasing visual creativity and professional work</p>'
              }
            }
          }
        ]
      },
      {
        '@type': '@builder.io/sdk:Element',
        '@version': 2,
        id: 'portfolio-gallery',
        component: {
          name: 'ds-file-gallery',
          options: {
            title: 'Portfolio Gallery',
            description: 'Browse through my creative work and professional projects',
            allowUpload: false,
            allowDelete: false,
            allowPreview: true,
            showFilters: true,
            acceptedTypes: ['image/*', 'video/*'],
            maxFileSize: 25,
            maxFiles: 200
          }
        }
      }
    ]
  }
};

// Multi-Step Form Template
export const multiStepFormTemplate: BuilderTemplate = {
  name: 'Multi-Step Form Workflow',
  description: 'Advanced multi-step form with validation and progress tracking',
  category: 'Forms',
  data: {
    blocks: [
      {
        '@type': '@builder.io/sdk:Element',
        '@version': 2,
        id: 'multi-step-form',
        component: {
          name: 'ds-multi-step-form',
          options: {
            title: 'User Registration Workflow',
            description: 'Complete your profile setup in 3 easy steps',
            showProgress: true,
            allowNavigation: true,
            showSummary: true,
            steps: [
              {
                id: 'personal',
                title: 'Personal Information',
                description: 'Tell us about yourself',
                validation: 'required',
                fields: [
                  {
                    id: 'firstName',
                    component: 'ds-input',
                    label: 'First Name',
                    required: true,
                    validation: '[{"type": "required", "message": "First name is required"}]',
                    properties: {
                      variant: 'outlined',
                      size: 'medium',
                      placeholder: 'Enter your first name'
                    }
                  },
                  {
                    id: 'lastName',
                    component: 'ds-input',
                    label: 'Last Name',
                    required: true,
                    validation: '[{"type": "required", "message": "Last name is required"}]',
                    properties: {
                      variant: 'outlined',
                      size: 'medium',
                      placeholder: 'Enter your last name'
                    }
                  },
                  {
                    id: 'email',
                    component: 'ds-input',
                    label: 'Email Address',
                    required: true,
                    validation: '[{"type": "required"}, {"type": "email"}]',
                    properties: {
                      type: 'email',
                      variant: 'outlined',
                      size: 'medium',
                      placeholder: 'Enter your email address'
                    }
                  },
                  {
                    id: 'phone',
                    component: 'ds-input',
                    label: 'Phone Number',
                    required: false,
                    properties: {
                      type: 'tel',
                      variant: 'outlined',
                      size: 'medium',
                      placeholder: 'Enter your phone number'
                    }
                  }
                ]
              },
              {
                id: 'professional',
                title: 'Professional Details',
                description: 'Your work and experience information',
                validation: 'required',
                fields: [
                  {
                    id: 'company',
                    component: 'ds-input',
                    label: 'Company/Organization',
                    required: true,
                    validation: '[{"type": "required", "message": "Company is required"}]',
                    properties: {
                      variant: 'outlined',
                      size: 'medium',
                      placeholder: 'Enter your company name'
                    }
                  },
                  {
                    id: 'jobTitle',
                    component: 'ds-input',
                    label: 'Job Title',
                    required: true,
                    validation: '[{"type": "required", "message": "Job title is required"}]',
                    properties: {
                      variant: 'outlined',
                      size: 'medium',
                      placeholder: 'Enter your job title'
                    }
                  },
                  {
                    id: 'experience',
                    component: 'ds-input',
                    label: 'Years of Experience',
                    required: false,
                    properties: {
                      type: 'number',
                      variant: 'outlined',
                      size: 'medium',
                      placeholder: 'Years of experience'
                    }
                  },
                  {
                    id: 'resume',
                    component: 'ds-file-upload',
                    label: 'Upload Resume/CV',
                    required: false,
                    properties: {
                      accept: '.pdf,.doc,.docx',
                      maxFileSize: 5,
                      maxFiles: 1,
                      uploadText: 'Drop your resume here or click to browse',
                      height: '150px'
                    }
                  }
                ]
              },
              {
                id: 'preferences',
                title: 'Preferences & Final Steps',
                description: 'Customize your experience and review your information',
                validation: 'optional',
                fields: [
                  {
                    id: 'notifications',
                    component: 'ds-card',
                    label: 'Notification Preferences',
                    required: false,
                    properties: {
                      variant: 'outlined',
                      padding: 'medium',
                      header: 'How would you like to receive updates?',
                      interactive: false
                    }
                  },
                  {
                    id: 'newsletter',
                    component: 'ds-input',
                    label: 'Subscribe to Newsletter',
                    required: false,
                    properties: {
                      type: 'checkbox',
                      variant: 'default',
                      helperText: 'Receive updates about new features and industry insights'
                    }
                  },
                  {
                    id: 'comments',
                    component: 'ds-input',
                    label: 'Additional Comments',
                    required: false,
                    properties: {
                      variant: 'outlined',
                      size: 'medium',
                      placeholder: 'Any additional information you\'d like to share...'
                    }
                  }
                ]
              }
            ]
          }
        }
      }
    ]
  }
};

// Expert Onboarding Template
export const expertOnboardingTemplate: BuilderTemplate = {
  name: 'Expert Onboarding Flow',
  description: 'Comprehensive onboarding for professional users',
  category: 'Workflows',
  data: {
    blocks: [
      {
        '@type': '@builder.io/sdk:Element',
        '@version': 2,
        id: 'expert-onboarding',
        component: {
          name: 'ds-card',
          options: {
            variant: 'elevated',
            padding: 'large',
            header: 'Welcome to the Platform',
            alignment: 'center',
            contentDirection: 'column',
            gap: '32px'
          }
        },
        children: [
          {
            '@type': '@builder.io/sdk:Element',
            component: {
              name: 'Text',
              options: {
                text: '<h2>Complete Your Expert Profile</h2><p>Set up your professional profile to unlock all platform features and connect with potential clients.</p>'
              }
            }
          },
          {
            '@type': '@builder.io/sdk:Element',
            component: {
              name: 'ds-multi-step-form',
              options: {
                title: 'Expert Onboarding',
                showProgress: true,
                allowNavigation: false,
                showSummary: true,
                steps: [
                  {
                    id: 'expertise',
                    title: 'Your Expertise',
                    description: 'Tell us about your professional skills and experience',
                    fields: [
                      {
                        id: 'specialization',
                        component: 'ds-input',
                        label: 'Primary Specialization',
                        required: true,
                        validation: '[{"type": "required"}]'
                      },
                      {
                        id: 'certifications',
                        component: 'ds-file-upload',
                        label: 'Upload Certifications',
                        required: false,
                        properties: {
                          multiple: true,
                          accept: '.pdf,.jpg,.png',
                          maxFileSize: 10
                        }
                      }
                    ]
                  },
                  {
                    id: 'portfolio',
                    title: 'Portfolio & Samples',
                    description: 'Showcase your best work',
                    fields: [
                      {
                        id: 'portfolio',
                        component: 'ds-file-upload',
                        label: 'Upload Portfolio Files',
                        required: false,
                        properties: {
                          multiple: true,
                          accept: 'image/*,.pdf',
                          maxFiles: 10,
                          maxFileSize: 25
                        }
                      }
                    ]
                  },
                  {
                    id: 'verification',
                    title: 'Verification',
                    description: 'Final verification and setup',
                    fields: [
                      {
                        id: 'terms',
                        component: 'ds-input',
                        label: 'I agree to the Terms of Service',
                        required: true,
                        validation: '[{"type": "required"}]'
                      }
                    ]
                  }
                ]
              }
            }
          }
        ]
      }
    ]
  }
};

// Export all templates
export const builderTemplates = [
  landingPageTemplate,
  contactFormTemplate,
  productShowcaseTemplate,
  fileUploadGalleryTemplate,
  documentManagementTemplate,
  mediaPortfolioTemplate,
  multiStepFormTemplate,
  expertOnboardingTemplate
];

// Function to register templates with Builder.io
export function registerBuilderTemplates() {
  // console.log('📋 Page Templates Available:');
  builderTemplates.forEach(() => {
    // Template logging removed for performance
  });
  
  // console.log('\n🚀 Templates ready for Builder.io integration');
  // console.log('💡 These templates showcase the full capability of our design system');
  return builderTemplates;
}
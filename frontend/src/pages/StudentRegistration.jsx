import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  User,
  Users,
  Shield,
  MapPin,
  GraduationCap,
  FileCheck,
  Building,
  Calendar,
  Phone,
  CreditCard
} from 'lucide-react';
import api from '../services/api';

const STEPS = [
  { id: 1, title: 'Basic Info', icon: User },
  { id: 2, title: 'Father Details', icon: Users },
  { id: 3, title: 'Mother Details', icon: Users },
  { id: 4, title: 'Guardian', icon: Shield },
  { id: 5, title: 'Contact & Address', icon: MapPin },
  { id: 6, title: 'Previous School', icon: GraduationCap },
  { id: 7, title: 'Enrollment & Review', icon: FileCheck },
];

export default function StudentRegistration() {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // 7-step Form State
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    name: '',
    dateOfBirth: '',
    gender: 'male',
    bloodGroup: '',
    religion: 'Islam',
    nationality: 'Pakistani',
    bFormNumber: '',
    grNumber: '', // Optional per Sec 7 & 45
    admissionDate: new Date().toISOString().slice(0, 10),

    // Step 2: Father Details
    fatherName: '',
    fatherCnic: '',
    fatherPhone: '',
    fatherEmail: '',
    fatherOccupation: '',
    fatherMonthlyIncome: '',
    fatherIsAlive: true,

    // Step 3: Mother Details
    motherName: '',
    motherCnic: '',
    motherPhone: '',
    motherOccupation: '',
    motherIsAlive: true,

    // Step 4: Guardian Details
    guardianIsFather: true,
    guardianName: '',
    guardianRelation: 'Father',
    guardianCnic: '',
    guardianPhone: '',
    guardianOccupation: '',

    // Step 5: Contact & Address
    primaryPhone: '',
    emergencyPhone: '',
    email: '',
    presentAddress: '',
    permanentAddress: '',
    city: 'Karachi',
    district: 'Central',

    // Step 6: Previous School
    previousSchoolName: '',
    previousClass: '',
    previousGrNumber: '',
    leavingCertificateNumber: '',
    leavingDate: '',
    remarks: '',

    // Step 7: Academic Enrollment
    academicSession: '',
    class: '',
    section: '',
    rollNumber: '',
  });

  useEffect(() => {
    fetchAcademicData();
  }, []);

  const fetchAcademicData = async () => {
    try {
      const [clsRes, secRes, sesRes] = await Promise.all([
        api.get('/classes'),
        api.get('/sections'),
        api.get('/sessions'),
      ]);

      const clsList = clsRes?.data?.classes || clsRes?.data?.data?.classes || [];
      const secList = secRes?.data?.sections || secRes?.data?.data?.sections || [];
      const sesList = sesRes?.data?.sessions || sesRes?.data?.data?.sessions || [];

      setClasses(clsList);
      setSections(secList);
      setSessions(sesList);

      const activeSes = sesList.find((s) => s.isCurrent) || sesList[0];
      if (activeSes) {
        setFormData((prev) => ({ ...prev, academicSession: activeSes._id }));
      }
      if (clsList.length > 0) {
        setFormData((prev) => ({ ...prev, class: clsList[0]._id }));
      }
    } catch (err) {
      console.error('Failed to load academic setup data:', err);
      setError('Could not load academic classes or sessions.');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Sync guardian with father if selected
  const handleGuardianCheckbox = (checked) => {
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        guardianIsFather: true,
        guardianName: prev.fatherName,
        guardianRelation: 'Father',
        guardianCnic: prev.fatherCnic,
        guardianPhone: prev.fatherPhone,
        guardianOccupation: prev.fatherOccupation,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        guardianIsFather: false,
        guardianName: '',
        guardianRelation: 'Guardian',
        guardianCnic: '',
        guardianPhone: '',
        guardianOccupation: '',
      }));
    }
  };

  // Step validation
  const validateStep = (step) => {
    setError(null);
    if (step === 1) {
      if (!formData.name.trim()) return 'Student full name is required';
      if (!formData.dateOfBirth) return 'Date of birth is required';
      if (!formData.gender) return 'Gender is required';
    }
    if (step === 2) {
      if (!formData.fatherName.trim()) return "Father's name is required";
      if (!formData.fatherPhone.trim()) return "Father's phone number is required";
    }
    if (step === 5) {
      if (!formData.primaryPhone.trim() && !formData.fatherPhone.trim()) {
        return 'At least one contact phone is required';
      }
      if (!formData.presentAddress.trim()) {
        return 'Present residential address is required';
      }
    }
    if (step === 7) {
      if (!formData.academicSession) return 'Academic session is required';
      if (!formData.class) return 'Target class is required';
      if (!formData.section) return 'Target section is required';
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep(currentStep);
    if (err) {
      setError(err);
      return;
    }
    // Auto-sync primary phone if empty
    if (currentStep === 2 && !formData.primaryPhone && formData.fatherPhone) {
      setFormData((p) => ({ ...p, primaryPhone: p.fatherPhone }));
    }
    setCurrentStep((prev) => Math.min(STEPS.length, prev + 1));
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validateStep(7);
    if (err) {
      setError(err);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        name: formData.name.trim(),
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup || undefined,
        religion: formData.religion || 'Islam',
        nationality: formData.nationality || 'Pakistani',
        bFormNumber: formData.bFormNumber || undefined,
        grNumber: formData.grNumber ? formData.grNumber.trim() : undefined,
        admissionDate: formData.admissionDate || new Date(),

        father: {
          name: formData.fatherName.trim(),
          cnic: formData.fatherCnic || undefined,
          phone: formData.fatherPhone.trim(),
          email: formData.fatherEmail || undefined,
          occupation: formData.fatherOccupation || undefined,
          monthlyIncome: formData.fatherMonthlyIncome ? Number(formData.fatherMonthlyIncome) : undefined,
          isAlive: formData.fatherIsAlive,
        },

        mother: {
          name: formData.motherName ? formData.motherName.trim() : undefined,
          cnic: formData.motherCnic || undefined,
          phone: formData.motherPhone || undefined,
          occupation: formData.motherOccupation || undefined,
          isAlive: formData.motherIsAlive,
        },

        guardian: {
          isFatherGuardian: formData.guardianIsFather,
          name: formData.guardianIsFather ? formData.fatherName : (formData.guardianName || formData.fatherName),
          relation: formData.guardianIsFather ? 'Father' : (formData.guardianRelation || 'Guardian'),
          cnic: formData.guardianIsFather ? formData.fatherCnic : formData.guardianCnic,
          phone: formData.guardianIsFather ? formData.fatherPhone : (formData.guardianPhone || formData.fatherPhone),
          occupation: formData.guardianIsFather ? formData.fatherOccupation : formData.guardianOccupation,
        },

        contact: {
          phone: formData.primaryPhone || formData.fatherPhone,
          emergencyPhone: formData.emergencyPhone || undefined,
          email: formData.email || undefined,
        },

        address: {
          present: formData.presentAddress,
          permanent: formData.permanentAddress || formData.presentAddress,
          city: formData.city || 'Karachi',
          district: formData.district || undefined,
        },

        previousSchool: formData.previousSchoolName ? {
          schoolName: formData.previousSchoolName,
          previousClass: formData.previousClass || undefined,
          grNumber: formData.previousGrNumber || undefined,
          leavingCertificateNumber: formData.leavingCertificateNumber || undefined,
          leavingDate: formData.leavingDate || undefined,
          remarks: formData.remarks || undefined,
        } : undefined,

        academicSession: formData.academicSession,
        class: formData.class,
        section: formData.section,
        rollNumber: formData.rollNumber ? formData.rollNumber.trim() : undefined,
      };

      const res = await api.post('/students', payload);
      const studentId = res?.data?.student?._id || res?.data?.data?.student?._id;
      if (studentId) {
        navigate(`/students/${studentId}`);
      } else {
        navigate('/students');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Failed to complete registration.');
    } finally {
      setSubmitting(false);
    }
  };

  const availableSections = sections.filter((s) => (s.class?._id || s.class) === formData.class);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/students')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 mb-2 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Students
          </button>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <UserPlus className="w-7 h-7 text-indigo-600" />
            Student Admission & Registration Wizard
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Section 15: 7-step comprehensive student intake, demographics, and initial academic enrollment.
          </p>
        </div>
      </div>

      {/* Wizard Step Progress Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
        <div className="flex items-center justify-between overflow-x-auto gap-2 py-1">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const isCompleted = currentStep > s.id;
            const isCurrent = currentStep === s.id;

            return (
              <div
                key={s.id}
                onClick={() => isCompleted && setCurrentStep(s.id)}
                className={`flex items-center gap-2 cursor-pointer flex-shrink-0 ${
                  isCurrent
                    ? 'text-indigo-600 font-bold'
                    : isCompleted
                    ? 'text-emerald-600 font-medium'
                    : 'text-gray-400 font-normal'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition ${
                    isCurrent
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : isCompleted
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : s.id}
                </div>
                <span className="text-xs hidden md:inline">{s.title}</span>
                {s.id < STEPS.length && (
                  <div
                    className={`w-6 h-0.5 ml-2 ${
                      isCompleted ? 'bg-emerald-300' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Steps */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6">
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600" /> Step 1: Basic Student Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Syed Ali Raza"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Blood Group</label>
                <select
                  value={formData.bloodGroup}
                  onChange={(e) => handleInputChange('bloodGroup', e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select blood group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Religion</label>
                <input
                  type="text"
                  value={formData.religion}
                  onChange={(e) => handleInputChange('religion', e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nationality</label>
                <input
                  type="text"
                  value={formData.nationality}
                  onChange={(e) => handleInputChange('nationality', e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">B-Form / CNIC Number</label>
                <input
                  type="text"
                  placeholder="42101-1234567-1"
                  value={formData.bFormNumber}
                  onChange={(e) => handleInputChange('bFormNumber', e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  GR Number <span className="text-gray-400 font-normal">(Optional, unique if given)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. GR-801"
                  value={formData.grNumber}
                  onChange={(e) => handleInputChange('grNumber', e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Admission Date</label>
                <input
                  type="date"
                  value={formData.admissionDate}
                  onChange={(e) => handleInputChange('admissionDate', e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Father Details */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" /> Step 2: Father Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Father's Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Syed Hussain Raza"
                  value={formData.fatherName}
                  onChange={(e) => handleInputChange('fatherName', e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Father's Phone / Mobile <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="0301-1122334"
                  value={formData.fatherPhone}
                  onChange={(e) => handleInputChange('fatherPhone', e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Father's CNIC</label>
                <input
                  type="text"
                  placeholder="42101-1112233-1"
                  value={formData.fatherCnic}
                  onChange={(e) => handleInputChange('fatherCnic', e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Father's Occupation</label>
                <input
                  type="text"
                  placeholder="e.g. Civil Engineer / Businessman"
                  value={formData.fatherOccupation}
                  onChange={(e) => handleInputChange('fatherOccupation', e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Estimated Monthly Income (PKR)</label>
                <input
                  type="number"
                  placeholder="e.g. 75000"
                  value={formData.fatherMonthlyIncome}
                  onChange={(e) => handleInputChange('fatherMonthlyIncome', e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Father's Email</label>
                <input
                  type="email"
                  placeholder="father@example.com"
                  value={formData.fatherEmail}
                  onChange={(e) => handleInputChange('fatherEmail', e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Mother Details */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" /> Step 3: Mother Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Mother's Name</label>
                <input
                  type="text"
                  placeholder="Mother's Full Name"
                  value={formData.motherName}
                  onChange={(e) => handleInputChange('motherName', e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Mother's CNIC</label>
                <input
                  type="text"
                  placeholder="42101-2223344-2"
                  value={formData.motherCnic}
                  onChange={(e) => handleInputChange('motherCnic', e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Mother's Phone</label>
                <input
                  type="text"
                  placeholder="0302-2233445"
                  value={formData.motherPhone}
                  onChange={(e) => handleInputChange('motherPhone', e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Mother's Occupation</label>
                <input
                  type="text"
                  placeholder="e.g. Teacher / Homemaker"
                  value={formData.motherOccupation}
                  onChange={(e) => handleInputChange('motherOccupation', e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Guardian Details */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-600" /> Step 4: Guardian Information
            </h3>

            <div className="flex items-center gap-2 p-3 bg-indigo-50/60 rounded-lg border border-indigo-100">
              <input
                type="checkbox"
                id="sameAsFather"
                checked={formData.guardianIsFather}
                onChange={(e) => handleGuardianCheckbox(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="sameAsFather" className="text-xs font-semibold text-indigo-900 cursor-pointer">
                Same as Father (auto-copy father details as legal guardian)
              </label>
            </div>

            {!formData.guardianIsFather && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Guardian Name</label>
                  <input
                    type="text"
                    value={formData.guardianName}
                    onChange={(e) => handleInputChange('guardianName', e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Relationship to Student</label>
                  <input
                    type="text"
                    placeholder="e.g. Uncle / Grandfather"
                    value={formData.guardianRelation}
                    onChange={(e) => handleInputChange('guardianRelation', e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Guardian Phone</label>
                  <input
                    type="text"
                    value={formData.guardianPhone}
                    onChange={(e) => handleInputChange('guardianPhone', e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Guardian CNIC</label>
                  <input
                    type="text"
                    value={formData.guardianCnic}
                    onChange={(e) => handleInputChange('guardianCnic', e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Contact & Address */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-600" /> Step 5: Residential & Contact Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Primary Mobile / Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="0300-1234567"
                  value={formData.primaryPhone}
                  onChange={(e) => handleInputChange('primaryPhone', e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Emergency Contact Phone</label>
                <input
                  type="text"
                  placeholder="0321-7654321"
                  value={formData.emergencyPhone}
                  onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="student@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Present Residential Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows="2"
                  required
                  placeholder="House / Flat No, Street, Sector, Area..."
                  value={formData.presentAddress}
                  onChange={(e) => handleInputChange('presentAddress', e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Permanent Address (Optional, leave blank if same)
                </label>
                <textarea
                  rows="2"
                  placeholder="Permanent village / hometown address..."
                  value={formData.permanentAddress}
                  onChange={(e) => handleInputChange('permanentAddress', e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Previous School */}
        {currentStep === 6 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-600" /> Step 6: Previous School & Records (Optional)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Previous School Name</label>
                <input
                  type="text"
                  placeholder="e.g. Army Public School"
                  value={formData.previousSchoolName}
                  onChange={(e) => handleInputChange('previousSchoolName', e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Last Class Passed</label>
                <input
                  type="text"
                  placeholder="e.g. Class 7"
                  value={formData.previousClass}
                  onChange={(e) => handleInputChange('previousClass', e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">School Leaving Certificate No</label>
                <input
                  type="text"
                  placeholder="e.g. SLC-9821"
                  value={formData.leavingCertificateNumber}
                  onChange={(e) => handleInputChange('leavingCertificateNumber', e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Date of Leaving</label>
                <input
                  type="date"
                  value={formData.leavingDate}
                  onChange={(e) => handleInputChange('leavingDate', e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 7: Academic Enrollment & Review */}
        {currentStep === 7 && (
          <div className="space-y-6">
            <h3 className="text-base font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-indigo-600" /> Step 7: Initial Academic Enrollment & Verification
            </h3>

            {/* Academic Assignment Selectors */}
            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 mb-3">
                Class & Section Enrollment
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Academic Session <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.academicSession}
                    onChange={(e) => handleInputChange('academicSession', e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    {sessions.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} {s.isCurrent ? '(Current)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Admit to Class <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.class}
                    onChange={(e) => {
                      handleInputChange('class', e.target.value);
                      handleInputChange('section', '');
                    }}
                    className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select class</option>
                    {classes.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Assign Section <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.section}
                    onChange={(e) => handleInputChange('section', e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select section</option>
                    {availableSections.map((sec) => (
                      <option key={sec._id} value={sec._id}>
                        Section {sec.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Roll Number <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 01"
                    value={formData.rollNumber}
                    onChange={(e) => handleInputChange('rollNumber', e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Comprehensive Review Summary */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600">
                Application Review Summary
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-gray-400 block">Student:</span>
                  <span className="font-semibold text-gray-800">{formData.name}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">DOB / Gender:</span>
                  <span className="font-semibold text-gray-800">
                    {formData.dateOfBirth} ({formData.gender})
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block">GR Number:</span>
                  <span className="font-semibold text-gray-800">{formData.grNumber || 'Unassigned (auto)'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Father Name:</span>
                  <span className="font-semibold text-gray-800">{formData.fatherName}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Primary Phone:</span>
                  <span className="font-semibold text-gray-800">{formData.primaryPhone || formData.fatherPhone}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">City / Address:</span>
                  <span className="font-semibold text-gray-800">
                    {formData.city} - {formData.presentAddress.slice(0, 20)}...
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block">Target Class:</span>
                  <span className="font-semibold text-indigo-700">
                    {classes.find((c) => c._id === formData.class)?.name || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block">Target Section:</span>
                  <span className="font-semibold text-indigo-700">
                    {availableSections.find((s) => s._id === formData.section)?.name || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="flex items-center justify-between pt-6 border-t mt-6">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 1 || submitting}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>

          {currentStep < STEPS.length ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm transition"
            >
              Next Step
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? 'Registering Student...' : 'Submit & Register Student'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
